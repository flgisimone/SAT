import { readFileSync } from 'node:fs';
import { chromium, expect, test } from '@playwright/test';

// The browser extension (dist/extension). Its button can't be clicked from a test, so the two halves
// are checked apart: Chromium loads the extension, and its script works on a page that doesn't know SAT.

const EXTENSION = new URL('../../dist/extension/', import.meta.url).pathname;

test('Chromium loads the extension and starts its service worker', async () => {
    const context = await chromium.launchPersistentContext('', {
        channel: 'chromium', // the full Chromium: the headless shell has no extensions
        args: [`--disable-extensions-except=${EXTENSION}`, `--load-extension=${EXTENSION}`],
    });
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    expect(worker.url()).toMatch(/^chrome-extension:\/\/[a-z]+\/background\.js$/);
    await context.close();
});

test('the script works on a page with a strict Content Security Policy', async ({ page }) => {
    // No inline styles or scripts allowed: the panel's styles must still apply.
    await page.route('http://site.test/**', (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === '/sat.js') return route.fulfill({ contentType: 'text/javascript; charset=utf-8', body: readFileSync(`${EXTENSION}sat.js`) });
        return route.fulfill({
            contentType: 'text/html',
            headers: { 'content-security-policy': "default-src 'self'" },
            body: '<!doctype html><html lang="en"><head><title>Site</title></head><body><main><h1>A</h1><h1>B</h1></main></body></html>',
        });
    });
    await page.goto('http://site.test/');
    // As the extension does: the script runs in the page's world (in Chromium it isn't subject to the CSP).
    await page.addScriptTag({ url: '/sat.js' });

    const run = page.locator('#sat-run-button');
    await expect(run).toHaveCSS('border-radius', '10px');
    await run.click();
    await expect(page.locator('.results')).toHaveText(/^\d+ errors? · /);

    await page.addScriptTag({ url: '/sat.js' }); // a second click
    await expect(page.locator('sat-panel')).toHaveCount(1);
});
