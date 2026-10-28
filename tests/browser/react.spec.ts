import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import react from '@vitejs/plugin-react';
import { build, createServer, type InlineConfig, type ViteDevServer } from 'vite';
import { sat } from '../../dist/vite.js';

// examples/react in vite dev with the plugin (dist/vite.js): the photo without alt text is rendered by React,
// and SAT points to its JSX in src/main.jsx without any change to the app.

const ROOT = new URL('../../examples/react/', import.meta.url).pathname;
const DIST = new URL('../../dist/', import.meta.url).pathname;
const expected = JSON.parse(readFileSync(new URL('../../examples/page/expected.json', import.meta.url), 'utf8')) as { options: object };
const PHOTO_LINE = readFileSync(join(ROOT, 'src/main.jsx'), 'utf8').split('\n').findIndex((line) => line.includes('<img id="photo"')) + 1;

const config = (): InlineConfig => ({
    root: ROOT,
    configFile: false,
    logLevel: 'silent',
    plugins: [react(), sat({ ...expected.options, mcp: true, axe: false })],
    resolve: { alias: [{ find: /^seo-accessibility-tool\/(.+)$/, replacement: `${DIST}$1.js` }] },
});

type Issues = Array<{ ruleId: string; component?: string }>;

let server: ViteDevServer;
let id = 1;

async function tool(name: string, args: object = {}) {
    const response = await fetch(`${server.resolvedUrls!.local[0]}__sat/mcp`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: id++, method: 'tools/call', params: { name, arguments: args } }),
    });
    return (await response.json() as { result: { content: Array<{ text?: string }>; structuredContent?: { pages: Array<{ issues: Issues }> } } }).result;
}

test.beforeAll(async () => {
    server = await createServer({ ...config(), server: { port: 0, host: '127.0.0.1' } });
    await server.listen();
});

test.afterAll(() => server.close());

test('sat_check: the prompt and the issue have the file and line of the JSX', async () => {
    const result = await tool('sat_check', { url: '/' });
    expect(result.content[0].text).toContain(`Component: /src/main.jsx:${PHOTO_LINE}\n`);
    const photo = result.structuredContent!.pages[0].issues.find((issue) => issue.ruleId === 'image-alt');
    expect(photo?.component).toBe(`/src/main.jsx:${PHOTO_LINE}`);
});

test('the page open in the browser sends the same component to sat_issues', async ({ page }) => {
    await page.goto(server.resolvedUrls!.local[0]);
    await page.locator('#sat-run-button').click();
    await expect(page.locator('.results')).toHaveText('5 errors · 3 warnings');
    await expect.poll(async () => (await tool('sat_issues')).structuredContent?.pages[0]?.issues.find((issue) => issue.ruleId === 'image-alt')?.component)
        .toBe(`/src/main.jsx:${PHOTO_LINE}`);
});

test('vite build: no SAT and no source positions in the bundle', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'sat-react-'));
    // The test runner sets NODE_ENV, which wins over the build's mode: production, as `vite build` has it.
    const nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
        await build({ ...config(), build: { outDir, emptyOutDir: true } });
        const files = readdirSync(outDir, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile());
        const output = files.map((entry) => readFileSync(join(entry.parentPath, entry.name), 'utf8')).join('\n');
        expect(output).toContain('photo');
        expect(output).not.toMatch(/seo-accessibility-tool|__sat|_jsxFileName|lineNumber:/);
    } finally {
        process.env.NODE_ENV = nodeEnv;
        rmSync(outDir, { recursive: true, force: true });
    }
});
