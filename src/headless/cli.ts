import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import type { Page } from '@playwright/test';
import type { CheckPageOptions } from './playwright';
import { formatIssues, htmlReport, plural, totals, type PageReport } from './report';

const USAGE = `Usage: sat-check <url...> [options]

Checks each page in Chromium (Playwright) and exits with 1 when the limits are exceeded.

  --max-errors <n>     errors allowed over all pages (default 0)
  --max-warnings <n>   warnings allowed over all pages (default: no limit)
  --json <file>        writes the report as JSON
  --html <file>        writes the report as an HTML page
  --config <file>      JSON file with SAT options, e.g. { "rules": { "link-text": "warning" } }
  --axe                runs axe-core too (needs the axe-core package)
  --wcag-level <level> AA (default) or AAA, which adds the AAA criteria as warnings
  -h, --help           shows this help`;

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
            help: { type: 'boolean', short: 'h' },
        },
    });
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

function printReport(pages: PageReport[], args: Args): void {
    for (const page of pages) {
        console.log(`\n${page.url}  ${plural(page.summary.errors, 'error')}, ${plural(page.summary.warnings, 'warning')}`);
        if (page.issues.length) console.log(formatIssues(page.issues));
    }
    const { errors, warnings } = totals(pages);
    const limits = `max ${args.maxErrors} errors${Number.isFinite(args.maxWarnings) ? `, ${args.maxWarnings} warnings` : ''}`;
    console.log(`\n${plural(pages.length, 'page')}: ${plural(errors, 'error')}, ${plural(warnings, 'warning')} (${limits})`);
}

async function main(argv: string[]): Promise<number> {
    const args = readArgs(argv);
    if (args.help || args.urls.length === 0) {
        console.log(USAGE);
        return args.help ? 0 : 2;
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

    printReport(pages, args);
    const summary = totals(pages);
    if (args.json) writeFileSync(args.json, `${JSON.stringify({ pages, summary }, null, 2)}\n`);
    if (args.html) writeFileSync(args.html, htmlReport(pages));

    return summary.errors > args.maxErrors || summary.warnings > args.maxWarnings ? 1 : 0;
}

main(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (error) => {
        if (error instanceof PageError) console.error(error.message);
        else console.error(error instanceof UsageError || String(error?.code).startsWith('ERR_PARSE_ARGS') ? `${error.message}\n\n${USAGE}` : error);
        process.exitCode = 2;
    },
);
