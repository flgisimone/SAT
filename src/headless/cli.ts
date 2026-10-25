import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import type { Page } from '@playwright/test';
import { ruleHelp } from '../sat/issue';
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
  --depth <n>          follows same-origin links this many levels deep and checks those pages too,
                       reporting broken links (default 0: only the given URLs)
  --max-pages <n>      stops after this many pages (default 100)
  --not-found <text>   a page showing this text is a broken link (the "not found" view of an SPA)
  -h, --help           shows this help`;

class UsageError extends Error {}

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
            depth: { type: 'string' },
            'max-pages': { type: 'string' },
            'not-found': { type: 'string' },
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
        depth: count(values.depth, 'depth', 0),
        maxPages: count(values['max-pages'], 'max-pages', 100),
        notFound: values['not-found'],
    };
}

type Args = ReturnType<typeof readArgs>;

/** Why the page just opened counts as a broken link, if it does. */
async function brokenReason(page: Page, status: number | undefined, notFound: string | undefined): Promise<string | undefined> {
    if (status !== undefined && status >= 400) return `status ${status}`;
    if (notFound && (await page.getByText(notFound).count()) > 0) return `shows "${notFound}"`;
    return undefined;
}

interface Visit {
    url: string;
    depth: number;
    /** The checked page that links here, and the first link's selector. */
    from?: { report: PageReport; selector: string; count: number };
}

/**
 * Checks the pages breadth first. Every page opens with a real navigation, so an SPA resolves
 * the route with its own router. ponytail: one page at a time; open tabs in parallel if large sites get slow.
 */
async function crawl(page: Page, args: Args, checkPage: typeof import('./playwright').checkPage): Promise<PageReport[]> {
    const { rules = {}, ...rest } = args.options;
    const brokenSetting = rules['link-broken'];
    // The crawler replaces the in-page rule, which can't see an SPA's 404s.
    const options: CheckPageOptions = { ...rest, rules: { ...rules, 'link-broken': 'off' } };

    const pages: PageReport[] = [];
    const queue: Visit[] = args.urls.map((url) => ({ url, depth: 0 }));
    const seen = new Set(args.urls);

    const addBroken = (report: PageReport, message: string, selector?: string) => {
        if (brokenSetting === 'off') return;
        const severity = brokenSetting === 'warning' ? 'warning' : 'error';
        report.issues.push({ ruleId: 'link-broken', severity, category: 'seo', message, selector, help: ruleHelp('link-broken') });
        report.summary[severity === 'error' ? 'errors' : 'warnings']++;
    };

    for (let visit = queue.shift(); visit && pages.length < args.maxPages; visit = queue.shift()) {
        let reason: string | undefined;
        try {
            const response = await page.goto(visit.url, { waitUntil: 'load' });
            // Let an SPA render after load; a page that never goes quiet is checked anyway.
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);
            reason = await brokenReason(page, response?.status(), args.notFound);
        } catch (error) {
            reason = `request failed: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`;
        }

        if (reason) {
            if (visit.from) {
                addBroken(visit.from.report, `Broken internal link: ${visit.url} (${reason}), used by ${visit.from.count} link(s).`, visit.from.selector);
            } else {
                const report: PageReport = { url: visit.url, issues: [], summary: { errors: 0, warnings: 0 } };
                addBroken(report, `Page can't be checked: ${visit.url} (${reason}).`);
                pages.push(report);
            }
            continue;
        }

        const report: PageReport = { url: visit.url, ...(await checkPage(page, options)) };
        pages.push(report);

        if (visit.depth >= args.depth) continue;
        const links = await page.evaluate(() => window.__sat!.internalLinks());
        for (const link of links) {
            if (seen.has(link.url)) continue;
            seen.add(link.url);
            queue.push({ url: link.url, depth: visit.depth + 1, from: { report, selector: link.selector, count: link.count } });
        }
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
        pages = await crawl(await browser.newPage({ bypassCSP: true }), args, helper.checkPage);
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
        console.error(error instanceof UsageError || String(error?.code).startsWith('ERR_PARSE_ARGS') ? `${error.message}\n\n${USAGE}` : error);
        process.exitCode = 2;
    },
);
