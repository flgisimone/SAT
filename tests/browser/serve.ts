import { existsSync, readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

const ORIGIN = 'http://sat.test';
const DIST = new URL('../../dist/', import.meta.url);

/**
 * Opens `html` at http://sat.test/ and serves the built bundle (dist/) from the same origin,
 * so the page imports the entry points as an app would, chunks included.
 * `extra` adds more modules by path (e.g. a stub for a bare import). Other paths answer 404.
 */
export async function openPage(page: Page, html: string, extra: Record<string, string> = {}): Promise<void> {
    await page.route(`${ORIGIN}/**`, (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === '/') return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
        if (path in extra) return route.fulfill({ contentType: 'text/javascript', body: extra[path] });
        const file = new URL(`.${path}`, DIST);
        if (!existsSync(file)) return route.fulfill({ status: 404, body: '' });
        return route.fulfill({ contentType: 'text/javascript', body: readFileSync(file) });
    });
    await page.goto(`${ORIGIN}/`);
}
