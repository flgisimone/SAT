import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import type { Page } from '@playwright/test';
import { compareBaseline, readBaseline, writeBaseline, type Baseline, type BaselineChanges } from './baseline';
import { hookOutput } from './hook';
import { init, mcpUrl, type Change } from './init';
import type { CheckPageOptions } from './playwright';
import { formatIssues, htmlReport, plural, totals, type PageReport } from './report';

const USAGE = `Usage: sat-check <url...> [options]
       sat-check init [route...] [--claude] [--port <n>] [--dry-run]
       sat-check hook [route...] [--port <n>]

Checks each page in Chromium (Playwright) and exits with 1 when the limits are exceeded.

  --max-errors <n>     errors allowed over all pages (default 0)
  --max-warnings <n>   warnings allowed over all pages (default: no limit)
  --baseline <file>    issues already in this file pass: the limits count only the new ones
  --update-baseline    writes the issues found to the --baseline file and exits with 0
  --json <file>        writes the report as JSON
  --html <file>        writes the report as an HTML page
  --config <file>      JSON file with SAT options, e.g. { "rules": { "link-text": "warning" } }
  --axe                runs axe-core too (needs the axe-core package)
  --wcag-level <level> AA (default) or AAA, which adds the AAA criteria as warnings
  -h, --help           shows this help

init prepares the project for coding agents: the SAT section of AGENTS.md, the MCP configuration of the
agents it finds (.mcp.json, .cursor, .vscode, .gemini), sat({ mcp: true }) in a simple vite.config.
  --claude             adds the Claude Code skill and a hook that checks the routes after each UI edit
                       (the routes given, / by default)
  --port <n>           port of vite dev (default 5173)
  --dry-run            prints the changes, writes nothing

hook is the command of the Claude Code hook: it reads the event on stdin and prints the new issues.`;

class UsageError extends Error {}

/** A page that can't be opened: the message is enough, without a stack. */
class PageError extends Error {}

function count(value: string | undefined, name: string, fallback: number): number {
    if (value === undefined) return fallback;
    const number = Number(value);
    if (!Number.isInteger(number) || number < 0) throw new UsageError(`--${name} must be a whole number ≥ 0, got "${value}".`);
    return number;
}

function readArgs(argv: string[]) {
    const { values, positionals } = parseArgs({
        args: argv,
        allowPositionals: true,
        options: {
            'max-errors': { type: 'string' },
            'max-warnings': { type: 'string' },
            json: { type: 'string' },
            html: { type: 'string' },
            config: { type: 'string' },
            axe: { type: 'boolean' },
            'wcag-level': { type: 'string' },
            baseline: { type: 'string' },
            'update-baseline': { type: 'boolean' },
            help: { type: 'boolean', short: 'h' },
        },
    });
    if (values['update-baseline'] && !values.baseline) throw new UsageError('--update-baseline needs --baseline <file>.');
    const wcagLevel = values['wcag-level'];
    if (wcagLevel !== undefined && wcagLevel !== 'AA' && wcagLevel !== 'AAA') {
        throw new UsageError(`--wcag-level must be AA or AAA, got "${wcagLevel}".`);
    }
    const urls = positionals.map((url) => {
        try {
            return new URL(url).toString();
        } catch {
            throw new UsageError(`Not a URL: "${url}" (include the protocol, e.g. http://localhost:5173/).`);
        }
    });

    return {
        help: values.help ?? false,
        urls,
        maxErrors: count(values['max-errors'], 'max-errors', 0),
        maxWarnings: count(values['max-warnings'], 'max-warnings', Infinity),
        json: values.json,
        html: values.html,
        baseline: values.baseline,
        updateBaseline: values['update-baseline'] ?? false,
        options: {
            ...(values.config ? JSON.parse(readFileSync(values.config, 'utf8')) : {}),
            // A flag adds to the config file, it doesn't unset what the file says.
            ...(values.axe && { axe: true }),
            ...(wcagLevel && { wcagLevel }),
        } as CheckPageOptions,
    };
}

type Args = ReturnType<typeof readArgs>;

/** Checks the pages one at a time. ponytail: open tabs in parallel if many URLs get slow. */
async function checkAll(page: Page, args: Args, checkPage: typeof import('./playwright').checkPage): Promise<PageReport[]> {
    const pages: PageReport[] = [];
    for (const url of args.urls) {
        await page.goto(url, { waitUntil: 'load' }).catch((error: Error) => {
            throw new PageError(`Can't open ${url}: ${error.message.split('\n')[0]}. Is the server started?`);
        });
        // Let an SPA render after load; a page that never goes quiet is checked anyway.
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);
        pages.push({ url, ...(await checkPage(page, args.options)) });
    }
    return pages;
}

type Compared = Map<string, BaselineChanges>;

function printReport(pages: PageReport[], args: Args, compared?: Compared): void {
    for (const page of pages) {
        const changes = compared?.get(page.url);
        const since = changes ? `; ${changes.new.length} new, ${changes.fixed.length} fixed since the baseline` : '';
        console.log(`\n${page.url}  ${plural(page.summary.errors, 'error')}, ${plural(page.summary.warnings, 'warning')}${since}`);
        const listed = changes ? changes.new : page.issues;
        if (listed.length) console.log(formatIssues(listed));
        if (changes?.fixed.length) console.log(`  fixed: ${changes.fixed.join('; ')}`);
    }
    const { errors, warnings } = totals(pages);
    const limits = `max ${args.maxErrors} errors${Number.isFinite(args.maxWarnings) ? `, ${args.maxWarnings} warnings` : ''}`;
    const counted = compared ? newTotals(compared) : undefined;
    const fresh = counted ? `; new: ${plural(counted.errors, 'error')}, ${plural(counted.warnings, 'warning')}` : '';
    console.log(`\n${plural(pages.length, 'page')}: ${plural(errors, 'error')}, ${plural(warnings, 'warning')}${fresh} (${limits})`);
}

function newTotals(compared: Compared) {
    const issues = [...compared.values()].flatMap((changes) => changes.new);
    return { errors: issues.filter((issue) => issue.severity === 'error').length, warnings: issues.filter((issue) => issue.severity === 'warning').length };
}

async function check(argv: string[]): Promise<number> {
    const args = readArgs(argv);
    if (args.help || args.urls.length === 0) {
        console.log(USAGE);
        return args.help ? 0 : 2;
    }
    let baseline: Baseline | undefined;
    if (args.baseline) {
        baseline = readBaseline(args.baseline);
        if (!baseline && !args.updateBaseline) throw new UsageError(`No baseline at ${args.baseline}: create it with --update-baseline.`);
    }

    let playwright: typeof import('@playwright/test');
    let helper: typeof import('./playwright');
    try {
        playwright = await import('@playwright/test');
        helper = await import('./playwright');
    } catch {
        console.error('sat-check needs Playwright: npm install -D @playwright/test && npx playwright install chromium');
        return 2;
    }

    const browser = await playwright.chromium.launch();
    let pages: PageReport[];
    try {
        // SAT is added to the page as an inline script: a strict Content Security Policy would block it.
        pages = await checkAll(await browser.newPage({ bypassCSP: true }), args, helper.checkPage);
    } finally {
        await browser.close();
    }

    if (args.updateBaseline) {
        writeBaseline(args.baseline!, pages, baseline);
        printReport(pages, args);
        console.log(`\nBaseline written to ${args.baseline}: ${plural(totals(pages).errors + totals(pages).warnings, 'issue')} accepted.`);
        return 0;
    }

    const compared: Compared | undefined = baseline && new Map(pages.map((page) => [page.url, compareBaseline(page, baseline)]));
    printReport(pages, args, compared);
    const summary = totals(pages);
    const report = pages.map((page) => {
        const changes = compared?.get(page.url);
        return changes ? { ...page, baseline: { new: changes.new.map((issue) => issue.id), fixed: changes.fixed } } : page;
    });
    if (args.json) writeFileSync(args.json, `${JSON.stringify({ pages: report, summary }, null, 2)}\n`);
    if (args.html) writeFileSync(args.html, htmlReport(pages));

    const counted = compared ? newTotals(compared) : summary;
    return counted.errors > args.maxErrors || counted.warnings > args.maxWarnings ? 1 : 0;
}

function port(value: string | undefined): number {
    const number = count(value, 'port', 5173);
    if (number < 1 || number > 65535) throw new UsageError(`--port must be from 1 to 65535, got "${value}".`);
    return number;
}

function routes(positionals: string[]): string[] {
    for (const route of positionals) if (!route.startsWith('/')) throw new UsageError(`A route is a path such as /cart, got "${route}".`);
    return positionals.length ? positionals : ['/'];
}

const ACTIONS: Record<Change['action'], string> = { create: 'create', update: 'update', unchanged: 'ok', manual: 'todo' };

function initCommand(argv: string[]): number {
    const { values, positionals } = parseArgs({
        args: argv,
        allowPositionals: true,
        options: { port: { type: 'string' }, claude: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, help: { type: 'boolean', short: 'h' } },
    });
    if (values.help) {
        console.log(USAGE);
        return 0;
    }
    const dryRun = values['dry-run'] ?? false;
    const changes = init({ root: process.cwd(), port: port(values.port), routes: routes(positionals), claude: values.claude ?? false, dryRun });
    if (dryRun) console.log('sat-check init --dry-run: nothing written.');
    for (const { file, action, detail } of changes) {
        console.log(`  ${ACTIONS[action].padEnd(8)}${file}${detail ? `\n${detail.replace(/^/gm, '          ')}` : ''}`);
    }
    console.log(`\nStart vite dev, then ask your agent: "Check / with SAT and fix the errors." The MCP server is at ${mcpUrl(port(values.port))}.`);
    return 0;
}

async function hookCommand(argv: string[]): Promise<number> {
    const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: { port: { type: 'string' } } });
    let input = '';
    for await (const chunk of process.stdin) input += chunk;
    const output = await hookOutput(input, { mcp: mcpUrl(port(values.port)), routes: routes(positionals) });
    if (output) console.log(output);
    return 0;
}

function main(argv: string[]): Promise<number> | number {
    if (argv[0] === 'init') return initCommand(argv.slice(1));
    if (argv[0] === 'hook') return hookCommand(argv.slice(1));
    return check(argv);
}

Promise.resolve().then(() => main(process.argv.slice(2))).then(
    (code) => { process.exitCode = code; },
    (error) => {
        if (error instanceof PageError) console.error(error.message);
        else console.error(error instanceof UsageError || String(error?.code).startsWith('ERR_PARSE_ARGS') ? `${error.message}\n\n${USAGE}` : error);
        process.exitCode = 2;
    },
);
