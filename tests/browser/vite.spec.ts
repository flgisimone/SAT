import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
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
    expect(output).not.toMatch(/sat-panel|seo-accessibility-tool|__sat/);
});

test.describe('Fix with AI (ai: true), with tests/fake-claude/claude in place of Claude Code', () => {
    const PATH = process.env.PATH;
    let app: string;
    let aiServer: ViteDevServer;

    test.beforeAll(async () => {
        app = mkdtempSync(join(tmpdir(), 'sat-ai-'));
        writeFileSync(join(app, 'index.html'), '<!doctype html><html lang="en"><head><title>Shop</title><meta name="description" content="A small shop."></head><body><main id="app"></main><script type="module" src="/main.js"></script></body></html>');
        writeFileSync(join(app, 'main.js'), `document.getElementById('app').innerHTML = '<h1>Shop</h1><img src="data:,">';\n`);
        process.env.PATH = `${new URL('../fake-claude', import.meta.url).pathname}${delimiter}${PATH}`;
        // The fake agent adds the alt text in main.js: Vite reloads the page.
        process.env.SAT_FAKE_EDIT = JSON.stringify({ file: 'main.js', from: '<img src="data:,">', to: '<img src="data:," alt="Shop logo">' });
        aiServer = await createServer({ ...config(), root: app, plugins: [sat({ ai: true })], server: { port: 0, host: '127.0.0.1' } });
        await aiServer.listen();
    });

    test.afterAll(async () => {
        process.env.PATH = PATH;
        delete process.env.SAT_FAKE_EDIT;
        await aiServer.close();
        rmSync(app, { recursive: true, force: true });
    });

    test('the agent edits the source, the page reloads, the issue is gone and the panel says "Fixed"', async ({ page }) => {
        await page.goto(aiServer.resolvedUrls!.local[0]);
        await page.locator('#sat-run-button').click();
        await expect(page.locator('.results')).toHaveText(/^1 error · /);
        await page.locator('.results').click();

        await page.locator('.rule', { hasText: 'Images have alternative text' }).getByRole('button', { name: 'Fix with AI', exact: true }).click();
        await expect(page.locator('.fix-status')).toHaveText('Fixed · Images have alternative text', { timeout: 15_000 });
        await expect(page.locator('.fix-files li')).toHaveText(['main.js']);
        await expect(page.locator('.results')).toHaveText(/^0 errors · /);
        expect(readFileSync(join(app, 'main.js'), 'utf8')).toContain('alt="Shop logo"');

        await page.getByRole('button', { name: 'Dismiss' }).click();
        await expect(page.locator('.fix')).toBeHidden();
    });
});
