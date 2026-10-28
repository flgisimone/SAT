import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import type {} from './inject'; // window.__sat

// Only type imports of Playwright: the Vite plugin loads this module without it.

const AXE_MISSING = 'axe-core is not installed: npm install -D axe-core';

/** dist/sat-inject.js: next to dist/playwright.js, one level above this module's chunk in dist/chunks/. */
function satScript(): string {
    const paths = ['./sat-inject.js', '../sat-inject.js'].map((path) => fileURLToPath(new URL(path, import.meta.url)));
    return paths.find((path) => existsSync(path)) ?? paths[0];
}

function axeScript(): string {
    try {
        return createRequire(import.meta.url).resolve('axe-core/axe.min.js');
    } catch {
        throw new Error(AXE_MISSING);
    }
}

/** Adds SAT (and axe-core with `axe`) to the page as it is now, unless it has them already. */
export async function addSAT(page: Page, axe: boolean): Promise<void> {
    // A navigation drops the scripts added before: check on every call.
    if (axe && !(await page.evaluate(() => 'axe' in window))) {
        await page.addScriptTag({ path: axeScript() });
    }
    if (!(await page.evaluate(() => Boolean(window.__sat)))) await page.addScriptTag({ path: satScript() });
}
