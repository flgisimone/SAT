import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

const ORIGIN = 'http://sat.test';
const DIST = new URL('../../dist/', import.meta.url);

/**
 * Opens `html` at http://sat.test/ and serves the built bundle (dist/) from the same origin,
 * so the page imports the entry points as an app would, chunks included.
 * `extra` adds more modules by path (e.g. a stub for a bare import).
 */
export async function openPage(page: Page, html: string, extra: Record<string, string> = {}): Promise<void> {
    await page.route(`${ORIGIN}/**`, (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === '/') return route.fulfill({ contentType: 'text/html', body: html });
        if (path in extra) return route.fulfill({ contentType: 'text/javascript', body: extra[path] });
        return route.fulfill({ contentType: 'text/javascript', body: readFileSync(new URL(`.${path}`, DIST)) });
    });
    await page.goto(`${ORIGIN}/`);
}
