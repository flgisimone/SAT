import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, test } from '@playwright/test';

// sat-check (dist/cli.js) on a small single-page app served with a history fallback,
// as a dev server does: every path answers 200 except /old.html.

const CLI = new URL('../../dist/cli.js', import.meta.url).pathname;

const APP = `<!doctype html><html lang="en"><head><title>SPA</title>
<meta name="description" content="A small single-page app."></head><body><div id="app"></div>
<script>
const routes = {
    '/': '<h1>Home</h1><nav><a href="/about">About</a> <a href="/missing">Missing</a> <a href="/old.html">Old</a> <a href="/logout">Log out</a></nav>',
    '/about': '<h1>About</h1><p>About us. <a href="/">Home</a></p>',
    '/photo': '<h1>Photo</h1><img src="data:,">',
};
document.getElementById('app').innerHTML = '<main>' + (routes[location.pathname] ?? '<h1>Page not found</h1>') + '</main>';
</script></body></html>`;

let server: Server;
let origin: string;
const requested: string[] = [];

test.beforeAll(async () => {
    server = createServer((request, response) => {
        requested.push(request.url ?? '');
        const csp = request.url === '/csp' ? { 'content-security-policy': "default-src 'self'" } : {};
        response.writeHead(request.url === '/old.html' ? 404 : 200, { 'content-type': 'text/html', ...csp });
        response.end(APP);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

test.afterAll(() => new Promise((resolve) => server.close(resolve)));

function satCheck(...args: string[]): Promise<{ code: number; stdout: string }> {
    return new Promise((resolve) => {
        execFile('node', [CLI, ...args], (error, stdout, stderr) => resolve({ code: error ? Number(error.code) : 0, stdout: stdout + stderr }));
    });
}

test('a clean page passes with exit code 0', async () => {
    const { code, stdout } = await satCheck(`${origin}/about`);

    expect(stdout).toContain(`${origin}/about  0 errors`);
    expect(code).toBe(0);
});

test('a page with a strict Content Security Policy is checked too', async () => {
    const { code, stdout } = await satCheck(`${origin}/csp`);

    expect(stdout).toContain(`${origin}/csp  0 errors`);
    expect(code).toBe(0);
});

test('crawling reports broken links, a missing SPA route included, and writes the reports', async () => {
    const testInfo = test.info();
    const json = testInfo.outputPath('report.json');
    const html = testInfo.outputPath('report.html');
    const { code, stdout } = await satCheck(`${origin}/`, '--depth', '1', '--not-found', 'Page not found', '--json', json, '--html', html);

    expect(stdout).toContain(`Broken internal link: ${origin}/missing (shows "Page not found"), used by 1 link(s).`);
    expect(stdout).toContain(`Broken internal link: ${origin}/old.html (status 404)`);
    expect(code).toBe(1);
    expect(requested).not.toContain('/logout');

    const report = JSON.parse(readFileSync(json, 'utf8'));
    expect(report.pages.map((page: { url: string }) => page.url)).toEqual([`${origin}/`, `${origin}/about`]);
    expect(report.pages[0].issues).toContainEqual(expect.objectContaining({ ruleId: 'link-broken', severity: 'error', selector: expect.stringContaining('a') }));
    expect(report.summary.errors).toBe(2);
    expect(readFileSync(html, 'utf8')).toContain('Broken internal link: ' + `${origin}/missing`);
});

test('limits and rule settings decide the exit code', async () => {
    const testInfo = test.info();
    const config = testInfo.outputPath('sat.json');
    writeFileSync(config, JSON.stringify({ rules: { 'link-broken': 'warning' } }));

    const { code, stdout } = await satCheck(`${origin}/`, '--depth', '1', '--config', config, '--max-warnings', '1');
    expect(stdout).toMatch(/warning\s+link-broken\s+Broken internal link: .*\/old\.html/);
    expect(code).toBe(1);

    expect((await satCheck(`${origin}/`, '--depth', '1', '--max-errors', '1')).code).toBe(0);
});

test('"axe": true in the config file runs axe-core', async () => {
    const config = test.info().outputPath('sat.json');
    writeFileSync(config, JSON.stringify({ axe: true }));

    const { stdout } = await satCheck(`${origin}/photo`, '--config', config);
    expect(stdout).toMatch(/error\s+axe\/image-alt/);
});

test('--wcag-level accepts AA or AAA only', async () => {
    const wrong = await satCheck(`${origin}/about`, '--wcag-level', 'A');
    expect(wrong.stdout).toContain('--wcag-level must be AA or AAA, got "A".');
    expect(wrong.code).not.toBe(0);

    const aaa = await satCheck(`${origin}/about`, '--wcag-level', 'AAA');
    expect(aaa.code).toBe(0);
});
