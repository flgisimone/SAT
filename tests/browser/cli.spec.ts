import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, test } from '@playwright/test';

// sat-check (dist/cli.js) on a small single-page app served with a history fallback,
// as a dev server does: every path answers 200.

const CLI = new URL('../../dist/cli.js', import.meta.url).pathname;

const APP = `<!doctype html><html lang="en"><head><title>SPA</title>
<meta name="description" content="A small single-page app."></head><body><div id="app"></div>
<script>
const routes = {
    '/about': '<h1>About</h1><p>About us. <a href="/">Home</a></p>',
    '/photo': '<h1>Photo</h1><img src="data:,">',
};
document.getElementById('app').innerHTML = '<main>' + (routes[location.pathname] ?? '<h1>Page not found</h1>') + '</main>';
</script></body></html>`;

let server: Server;
let origin: string;

test.beforeAll(async () => {
    server = createServer((request, response) => {
        const csp = request.url === '/csp' ? { 'content-security-policy': "default-src 'self'" } : {};
        response.writeHead(200, { 'content-type': 'text/html', ...csp });
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

test('checks every URL and writes the reports', async () => {
    const testInfo = test.info();
    const json = testInfo.outputPath('report.json');
    const html = testInfo.outputPath('report.html');
    const { code, stdout } = await satCheck(`${origin}/about`, `${origin}/photo`, '--json', json, '--html', html);

    expect(stdout).toMatch(/error\s+image-alt/);
    expect(code).toBe(1);

    const report = JSON.parse(readFileSync(json, 'utf8'));
    expect(report.pages.map((page: { url: string }) => page.url)).toEqual([`${origin}/about`, `${origin}/photo`]);
    expect(report.pages[1].issues).toContainEqual(expect.objectContaining({ ruleId: 'image-alt', severity: 'error', selector: expect.stringContaining('img') }));
    expect(readFileSync(html, 'utf8')).toContain('image-alt');
});

test('limits and rule settings decide the exit code', async () => {
    const testInfo = test.info();
    const config = testInfo.outputPath('sat.json');
    writeFileSync(config, JSON.stringify({ rules: { 'image-alt': 'warning' } }));

    const { code, stdout } = await satCheck(`${origin}/photo`, '--config', config, '--max-warnings', '0');
    expect(stdout).toMatch(/warning\s+image-alt/);
    expect(code).toBe(1);

    expect((await satCheck(`${origin}/photo`, '--config', config)).code).toBe(0);
});

test('a URL nothing answers at exits with 2 and says so', async () => {
    const { code, stdout } = await satCheck('http://127.0.0.1:1/');
    expect(stdout).toContain("Can't open http://127.0.0.1:1/");
    expect(stdout).toContain('Is the server started?');
    expect(code).toBe(2);
});

test('the crawler options of 1.x are gone', async () => {
    const { code, stdout } = await satCheck(`${origin}/`, '--depth', '1');
    expect(stdout).toContain("Unknown option '--depth'");
    expect(code).toBe(2);
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

test('--baseline: the issues in the baseline pass, a new one fails; --update-baseline writes it', async () => {
    const baseline = test.info().outputPath('sat-baseline.json');
    const missing = await satCheck(`${origin}/photo`, '--baseline', baseline);
    expect(missing.stdout).toContain(`No baseline at ${baseline}: create it with --update-baseline.`);
    expect(missing.code).toBe(2);

    const written = await satCheck(`${origin}/photo`, '--baseline', baseline, '--update-baseline');
    expect(written.code).toBe(0);
    const ids: string[] = JSON.parse(readFileSync(baseline, 'utf8'))[`${origin}/photo`];
    expect(ids).toContainEqual(expect.stringMatching(/^image-alt /));

    const same = await satCheck(`${origin}/photo`, '--baseline', baseline);
    expect(same.stdout).toContain('0 new, 0 fixed since the baseline');
    expect(same.code).toBe(0);

    // An issue out of the baseline is new, one in the baseline that isn't on the page is fixed.
    writeFileSync(baseline, JSON.stringify({ [`${origin}/photo`]: [...ids.filter((id) => !id.startsWith('image-alt ')), 'h1 old'] }));
    const json = test.info().outputPath('report.json');
    const worse = await satCheck(`${origin}/photo`, '--baseline', baseline, '--json', json);
    expect(worse.stdout).toContain('1 new, 1 fixed since the baseline');
    expect(worse.stdout).toMatch(/error\s+image-alt/);
    expect(worse.stdout).toContain('fixed: h1 old');
    expect(worse.code).toBe(1);
    expect(JSON.parse(readFileSync(json, 'utf8')).pages[0].baseline).toEqual({ new: [ids.find((id) => id.startsWith('image-alt '))], fixed: ['h1 old'] });
});
