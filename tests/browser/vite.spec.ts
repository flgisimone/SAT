import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { build, createServer, type InlineConfig, type ViteDevServer } from 'vite';
import { sat } from '../../dist/vite.js';

// The plugin (dist/vite.js) in a small Vite project that doesn't import SAT.
// The package's imports resolve to dist/, as they would to node_modules/seo-accessibility-tool/dist.

const ROOT = new URL('./vite-app/', import.meta.url).pathname;
const DIST = new URL('../../dist/', import.meta.url).pathname;

const config = (): InlineConfig => ({
    root: ROOT,
    configFile: false,
    logLevel: 'silent',
    plugins: [sat({ rules: { 'h1': 'warning' } })],
    resolve: { alias: [{ find: /^seo-accessibility-tool\/(.+)$/, replacement: `${DIST}$1.js` }] },
});

let server: ViteDevServer;

test.beforeAll(async () => {
    server = await createServer({ ...config(), server: { port: 0, host: '127.0.0.1' } });
    await server.listen();
});

test.afterAll(() => server.close());

test('vite dev: SAT starts on its own, with the options of the plugin', async ({ page }) => {
    await page.goto(server.resolvedUrls!.local[0]);
    await page.locator('#sat-run-button').click();
    // Two <h1>: an error by default, a warning with the plugin's rules.
    await expect(page.locator('.results')).toHaveText(/^0 errors · [1-9]\d* warnings?$/);
});

test('vite build: the bundle has no SAT', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'sat-vite-'));
    await build({ ...config(), build: { outDir, emptyOutDir: true } });

    const files = readdirSync(outDir, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile());
    const output = files.map((entry) => readFileSync(join(entry.parentPath, entry.name), 'utf8')).join('\n');
    expect(output).toContain('<h1>One</h1>');
    expect(output).not.toMatch(/sat-panel|seo-accessibility-tool/);
});
