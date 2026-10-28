import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import type { Browser, BrowserType } from '@playwright/test';
import { addSAT } from '../headless/addSAT';
import type { CheckPageOptions } from '../headless/playwright';
import type { PageResults, ReportedIssue } from '../sat/mcpResults';

// Only type imports of Playwright: it is an optional peer dependency, loaded from the project on the first `sat_check`.

export const PLAYWRIGHT_MISSING = 'sat_check opens the page in headless Chromium with Playwright, which is not installed in this project: '
    + 'npm install -D playwright, then npx playwright install chromium. Without it, open the page in the browser and use sat_issues.';
export const CHROMIUM_MISSING = 'sat_check needs the Chromium of Playwright, which is not installed: npx playwright install chromium';

/** Rules whose issues are easier to fix after seeing the element. */
export const VISUAL_RULES = ['color-contrast', 'target-size', 'h1-visible'];
const MAX_IMAGES = 5;
/** Pixels around the element in its image. */
const MARGIN = 16;
const LOAD_TIMEOUT = 15_000;
/** How long the page gets to finish its requests (data from an API) after `load`. */
const IDLE_TIMEOUT = 5000;

/** A failure the agent can do something about: the text says what. */
export class CheckError extends Error {}

export interface CheckArgs {
    viewport?: { width: number; height: number };
    colorScheme?: 'light' | 'dark';
    /** CSS selector to wait for before checking. */
    waitFor?: string;
    /** A PNG of the element for the issues of `VISUAL_RULES`, at most 5. */
    screenshots?: boolean;
}

export interface CheckResult {
    results: PageResults;
    images: Array<{ issue: ReportedIssue; png: string }>;
}

/** Playwright's Chromium from the first place that has `playwright` or `@playwright/test`: the project, then where SAT is installed. */
export async function loadChromium(from: string[]): Promise<BrowserType> {
    for (const base of from) {
        const require = createRequire(base);
        for (const name of ['playwright', '@playwright/test']) {
            let path: string;
            try {
                path = require.resolve(name);
            } catch {
                continue;
            }
            // CommonJS: the named exports may only be on `default`.
            const module = await import(pathToFileURL(path).href) as { chromium?: BrowserType; default?: { chromium?: BrowserType } };
            const chromium = module.chromium ?? module.default?.chromium;
            if (chromium) return chromium;
        }
    }
    throw new CheckError(PLAYWRIGHT_MISSING);
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error)).split('\n')[0];

export interface HeadlessCheckerOptions {
    /** Files or `file:` URLs to resolve Playwright from, in order. */
    from: string[];
    /** SAT options of the plugin, `axe` included. */
    options: CheckPageOptions;
    /** Requests answered with an empty script: SAT's own panel, which the page doesn't need in the check. */
    block: (url: URL) => boolean;
}

/**
 * Checks pages in headless Chromium. One browser, started on the first check and kept open for the next ones
 * (about 0.5 s to start, 50 ms per page after), and a new context for each check: no cookies or storage carry over.
 * ponytail: no limit on parallel checks, an agent calls one tool at a time; add a queue if a client sends them in bulk.
 */
export function headlessChecker({ from, options, block }: HeadlessCheckerOptions) {
    const { axe = false, ...satOptions } = options;
    let browser: Promise<Browser> | undefined;

    const launch = () => {
        if (browser) return browser;
        const started = (async () => {
            const chromium = await loadChromium(from);
            try {
                const instance = await chromium.launch();
                instance.on('disconnected', () => (browser = undefined));
                return instance;
            } catch (error) {
                if (/Executable doesn't exist|playwright install/.test(String(error))) throw new CheckError(CHROMIUM_MISSING);
                throw error;
            }
        })();
        // A failed start is tried again on the next check, e.g. after installing Chromium.
        started.catch(() => browser === started && (browser = undefined));
        return (browser = started);
    };

    return {
        /** Opens `url` (an address of the dev server), runs SAT, and returns the results and the images asked for. */
        async check(url: string, { viewport, colorScheme, waitFor, screenshots }: CheckArgs = {}): Promise<CheckResult> {
            // ponytail: a context without the user's cookies, so routes behind a login show the login page; the open pages (sat_issues) have them.
            // ignoreHTTPSErrors: `server.https` usually has a self-signed certificate, and only the dev server's own origin is ever opened.
            const context = await (await launch()).newContext({ ignoreHTTPSErrors: true, ...(viewport && { viewport }), ...(colorScheme && { colorScheme }) });
            try {
                await context.route(block, (route) => route.fulfill({ contentType: 'text/javascript', body: '' }));
                const page = await context.newPage();
                let response;
                try {
                    response = await page.goto(url, { waitUntil: 'load', timeout: LOAD_TIMEOUT });
                } catch (error) {
                    throw new CheckError(/Timeout/.test(String(error)) ? `The page at ${url} did not load within 15 seconds.` : `The page at ${url} did not load: ${message(error)}`);
                }
                if (response && response.status() >= 400) throw new CheckError(`The page at ${url} answered HTTP ${response.status()}.`);
                // A page that never goes quiet (polling, streaming) is checked as it is after 5 seconds.
                await page.waitForLoadState('networkidle', { timeout: IDLE_TIMEOUT }).catch(() => undefined);
                if (waitFor) {
                    await page.waitForSelector(waitFor, { timeout: LOAD_TIMEOUT }).catch((error: unknown) => {
                        throw new CheckError(`No element matched ${waitFor} within 15 seconds on ${page.url()}: ${message(error)}`);
                    });
                }

                await addSAT(page, axe);
                const results = await page.evaluate(([opts, useAxe]) => window.__sat!.results(opts, useAxe), [satOptions, axe] as const);

                const images: CheckResult['images'] = [];
                const visual = screenshots ? results.issues.filter((issue) => issue.selector && VISUAL_RULES.includes(issue.ruleId)) : [];
                for (const issue of visual.slice(0, MAX_IMAGES)) {
                    const png = await elementImage(page, issue.selector!).catch(() => undefined);
                    if (png) images.push({ issue, png });
                }
                return { results, images };
            } finally {
                await context.close();
            }
        },
        async close(): Promise<void> {
            const instance = await browser?.catch(() => undefined);
            browser = undefined;
            await instance?.close();
        },
    };
}

type Page = Awaited<ReturnType<Browser['newPage']>>;

/** The element and a margin around it, as base64 PNG; nothing for an element without a box (hidden). */
async function elementImage(page: Page, selector: string): Promise<string | undefined> {
    const element = page.locator(selector).first();
    await element.scrollIntoViewIfNeeded({ timeout: 2000 });
    const box = await element.boundingBox({ timeout: 2000 });
    const view = page.viewportSize();
    if (!box || !box.width || !box.height || !view) return undefined;
    const x = Math.max(0, box.x - MARGIN);
    const y = Math.max(0, box.y - MARGIN);
    const clip = { x, y, width: Math.min(view.width, box.x + box.width + MARGIN) - x, height: Math.min(view.height, box.y + box.height + MARGIN) - y };
    if (clip.width <= 0 || clip.height <= 0) return undefined;
    return (await page.screenshot({ clip })).toString('base64');
}

export type HeadlessChecker = ReturnType<typeof headlessChecker>;
