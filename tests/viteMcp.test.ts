// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer as createHttpServer, request, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer } from 'vite';
import { CheckError, loadChromium, PLAYWRIGHT_MISSING, type CheckResult } from '../src/integrations/headlessCheck';
import { mcpMiddleware, resultsStore } from '../src/integrations/mcpServer';
import { sat, type SATViteOptions } from '../src/integrations/vite';
import type { PageResults } from '../src/sat/mcpResults';

// The MCP endpoint and the results endpoint on a real Vite dev server.

const root = mkdtempSync(join(tmpdir(), 'sat-mcp-'));
writeFileSync(join(root, 'index.html'), '<!doctype html><title>App</title>');

async function devServer(options: SATViteOptions) {
    const plugin = sat(options);
    const server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [plugin], server: { port: 0, host: '127.0.0.1' } });
    await server.listen();
    const code = (plugin.load as (id: string) => string)((plugin.resolveId as (id: string) => string)('virtual:seo-accessibility-tool'));
    const origin = new URL(server.resolvedUrls!.local[0]).origin;
    return { server, origin, port: Number(new URL(origin).port), token: /"token":"([^"]+)"/.exec(code)?.[1] ?? '' };
}

let app: Awaited<ReturnType<typeof devServer>>;
let off: Awaited<ReturnType<typeof devServer>>;

interface Reply {
    status: number;
    body: string;
    json: { id?: unknown; result?: Record<string, unknown> & { content?: Array<{ text: string }> }; error?: { code: number; message: string; data?: unknown } };
}

/** A request with exactly these headers (fetch would set Host and others itself); a string body is sent as it is. */
function call(path: string, { method = 'POST', body, headers = {}, port = app.port }: { method?: string; body?: unknown; headers?: Record<string, string>; port?: number }): Promise<Reply> {
    return new Promise((resolve, reject) => {
        const req = request({ host: '127.0.0.1', port, path, method, headers: { host: `localhost:${port}`, 'content-type': 'application/json', ...headers } }, (res) => {
            let text = '';
            res.setEncoding('utf8').on('data', (chunk: string) => (text += chunk)).on('end', () => {
                let json = {};
                try {
                    json = JSON.parse(text);
                } catch {
                    // not JSON
                }
                resolve({ status: res.statusCode!, body: text, json });
            });
        });
        req.on('error', reject);
        req.end(body === undefined || typeof body === 'string' ? body : JSON.stringify(body));
    });
}

let nextId = 1;
const rpc = (method: string, params?: Record<string, unknown>, headers?: Record<string, string>) =>
    call('/__sat/mcp', { body: { jsonrpc: '2.0', id: nextId++, method, ...(params && { params }) }, headers });

const META = { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {} };
const modern = (method: string, params: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
    rpc(method, { ...params, _meta: META }, { 'mcp-protocol-version': '2026-07-28', 'mcp-method': method, ...headers });

const results = (url: string, issues: PageResults['issues']): PageResults => ({
    url, title: 'Shop', prompt: issues.length ? `Fix these ${issues.length} issues, found by SAT on ${url}.` : '', issues,
});

const send = (body: unknown, { token = app.token, origin = app.origin, port = app.port } = {}) =>
    call('/__sat/results', { body, port, headers: { 'x-sat-token': token, origin } });

const IMG = { id: 'image-alt img', ruleId: 'image-alt', severity: 'error' as const, title: 'Images have alternative text', message: 'Image without alt', selector: 'img', help: 'https://example.test/image-alt' };
const LINK = { id: 'link-text a', ruleId: 'link-text', severity: 'warning' as const, message: 'Link text "click here"', selector: 'a', component: '/src/App.vue' };

beforeAll(async () => {
    app = await devServer({ mcp: true });
    off = await devServer({});
});

afterAll(async () => {
    await Promise.all([app.server.close(), off.server.close()]);
    rmSync(root, { recursive: true, force: true });
});

describe('results endpoint', () => {
    it('refuses results without the token, from another origin, or with mcp off', async () => {
        const body = results('http://localhost/', [IMG]);
        expect((await send(body, { token: 'wrong' })).status).toBe(403);
        expect((await send(body, { origin: 'http://evil.test' })).status).toBe(403);
        expect((await send({ url: 'x' })).status).toBe(400);
        expect((await send(body, { token: off.token, origin: off.origin, port: off.port })).status).toBe(404);
        expect((await call('/__sat/mcp', { port: off.port, body: { jsonrpc: '2.0', id: 1, method: 'tools/list' } })).status).toBe(404);
    });

    it('keeps the last results of each page', async () => {
        expect((await send(results(`${app.origin}/replace`, [IMG, LINK]))).status).toBe(204);
        expect((await send(results(`${app.origin}/replace`, [LINK]))).status).toBe(204);
        const { json } = await rpc('tools/call', { name: 'sat_issues', arguments: { url: '/replace' } });
        const pages = (json.result!.structuredContent as { pages: PageResults[] }).pages;
        expect(pages).toEqual([{ url: `${app.origin}/replace`, title: 'Shop', issues: [LINK] }]);
    });
});

describe('MCP endpoint, versions up to 2025-11-25 (initialize)', () => {
    it('initialize agrees on the version of the client, or on the latest it knows', async () => {
        const { json } = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
        expect(json.result).toMatchObject({ protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'seo-accessibility-tool' } });
        expect(String(json.result!.instructions)).toContain('sat_issues');
        expect((await rpc('initialize', { protocolVersion: '2099-01-01' })).json.result!.protocolVersion).toBe('2025-11-25');
    });

    it('accepts notifications with 202 and answers ping', async () => {
        const reply = await call('/__sat/mcp', { body: { jsonrpc: '2.0', method: 'notifications/initialized' } });
        expect(reply.status).toBe(202);
        expect(reply.body).toBe('');
        expect((await rpc('ping')).json.result).toEqual({});
    });

    it('lists the three tools', async () => {
        const { json } = await rpc('tools/list');
        expect((json.result!.tools as Array<{ name: string }>).map((tool) => tool.name)).toEqual(['sat_issues', 'sat_recheck', 'sat_check']);
        expect(json.result).not.toHaveProperty('resultType');
    });

    it('sat_issues returns the prompt and the structured issues of the pages', async () => {
        await send(results(`${app.origin}/cart`, [IMG, LINK]));
        const { json } = await rpc('tools/call', { name: 'sat_issues', arguments: { url: `${app.origin}/cart` } });
        const text = json.result!.content![0].text;
        expect(text).toContain(`URL: ${app.origin}/cart`);
        expect(text).toContain('1 error, 1 warning.');
        expect(text).toContain(`Fix these 2 issues, found by SAT on ${app.origin}/cart.`);
        expect(json.result!.structuredContent).toEqual({ pages: [{ url: `${app.origin}/cart`, title: 'Shop', issues: [IMG, LINK] }] });

        const missing = await rpc('tools/call', { name: 'sat_issues', arguments: { url: '/nowhere' } });
        expect(missing.json.result!.content![0].text).toContain('SAT has no results for /nowhere');
    });

    it('sat_recheck asks the open pages to check again and returns their new results', async () => {
        expect((await rpc('tools/call', { name: 'sat_recheck' })).json.result!.content![0].text).toContain('No page of the app is open');

        // A page: the HMR client of Vite, which sends new results when it gets sat:run.
        const page = new WebSocket(`ws://127.0.0.1:${app.port}/`, 'vite-hmr');
        await new Promise((resolve) => page.addEventListener('open', resolve));
        page.addEventListener('message', (event) => {
            const message = JSON.parse(String(event.data)) as { type: string; event?: string };
            if (message.type === 'custom' && message.event === 'sat:run') void send(results(`${app.origin}/cart`, [LINK]));
        });
        try {
            const { json } = await rpc('tools/call', { name: 'sat_recheck', arguments: { url: '/cart' } });
            const text = json.result!.content![0].text;
            // sat_issues gave the agent IMG and LINK on /cart: the answer starts with what changed.
            expect(text.startsWith('/cart: 1 fixed (image-alt img), 0 new, 1 remaining.')).toBe(true);
            expect(text).toContain('0 errors, 1 warning.');
            expect(json.result!.structuredContent).toEqual({ pages: [{
                url: `${app.origin}/cart`, title: 'Shop', issues: [LINK], changes: { fixed: ['image-alt img'], new: [], remaining: ['link-text a'] },
            }] });
        } finally {
            page.close();
        }
    });

    it('unknown methods and tools are JSON-RPC errors', async () => {
        expect((await rpc('resources/list')).json.error).toMatchObject({ code: -32601 });
        expect((await rpc('tools/call', { name: 'sat_delete' })).json.error).toMatchObject({ code: -32602 });
        expect((await call('/__sat/mcp', { body: [{ jsonrpc: '2.0', id: 1, method: 'ping' }] })).json.error).toMatchObject({ code: -32600 });
        const broken = await call('/__sat/mcp', { body: '{"jsonrpc":' });
        expect(broken.status).toBe(400);
        expect(broken.json.error).toMatchObject({ code: -32700 });
    });
});

describe('MCP endpoint, 2026-07-28 (stateless)', () => {
    it('server/discover and tools/list carry resultType and serverInfo', async () => {
        const discover = (await modern('server/discover')).json.result!;
        expect(discover).toMatchObject({ resultType: 'complete', supportedVersions: expect.arrayContaining(['2026-07-28', '2025-06-18']), capabilities: { tools: {} } });
        expect(discover._meta).toEqual({ 'io.modelcontextprotocol/serverInfo': expect.objectContaining({ name: 'seo-accessibility-tool' }) });
        expect((await modern('tools/list')).json.result).toMatchObject({ resultType: 'complete', ttlMs: expect.any(Number), cacheScope: 'private' });
    });

    it('tools/call needs Mcp-Name equal to the tool, Base64 included', async () => {
        const ok = await modern('tools/call', { name: 'sat_issues' }, { 'mcp-name': 'sat_issues' });
        expect(ok.json.result).toMatchObject({ resultType: 'complete' });
        const encoded = await modern('tools/call', { name: 'sat_issues' }, { 'mcp-name': `=?base64?${Buffer.from('sat_issues').toString('base64')}?=` });
        expect(encoded.status).toBe(200);
        const missing = await modern('tools/call', { name: 'sat_issues' });
        expect(missing.status).toBe(400);
        expect(missing.json.error).toMatchObject({ code: -32020 });
    });

    it('rejects headers that differ from the body and versions it does not know', async () => {
        const mismatch = await modern('tools/list', {}, { 'mcp-method': 'tools/call' });
        expect(mismatch.status).toBe(400);
        expect(mismatch.json.error).toMatchObject({ code: -32020 });

        const version = await rpc('tools/list', { _meta: { ...META, 'io.modelcontextprotocol/protocolVersion': '1900-01-01' } }, { 'mcp-protocol-version': '1900-01-01', 'mcp-method': 'tools/list' });
        expect(version.status).toBe(400);
        expect(version.json.error).toMatchObject({ code: -32022, data: { supported: expect.arrayContaining(['2026-07-28']), requested: '1900-01-01' } });

        const unknown = await modern('resources/list');
        expect(unknown.status).toBe(404);
        expect(unknown.json.error).toMatchObject({ code: -32601 });
    });
});

describe('MCP endpoint security', () => {
    it('GET and DELETE get 405', async () => {
        expect((await call('/__sat/mcp', { method: 'GET' })).status).toBe(405);
        expect((await call('/__sat/mcp', { method: 'DELETE' })).status).toBe(405);
    });

    it('refuses a foreign Host (DNS rebinding) or Origin; accepts the local names and the dev server origin', async () => {
        const list = { jsonrpc: '2.0', id: 1, method: 'tools/list' };
        expect((await call('/__sat/mcp', { body: list, headers: { host: `evil.test:${app.port}` } })).status).toBe(403);
        expect((await call('/__sat/mcp', { body: list, headers: { host: 'localhost:1' } })).status).toBe(403);
        expect((await call('/__sat/mcp', { body: list, headers: { origin: 'http://evil.test' } })).status).toBe(403);
        expect((await call('/__sat/mcp', { body: list, headers: { host: `127.0.0.1:${app.port}` } })).status).toBe(200);
        expect((await call('/__sat/mcp', { body: list, headers: { origin: app.origin } })).status).toBe(200);
    });

    it('refuses connections that are not from this computer', () => {
        const middleware = mcpMiddleware({ store: resultsStore(), check: () => Promise.reject(new Error('unused')), recheck: () => 0, hosts: () => ['localhost:5173'], origins: () => [] });
        let status = 0;
        const req = { method: 'POST', socket: { remoteAddress: '192.168.1.20' }, headers: { host: 'localhost:5173' } } as unknown as IncomingMessage;
        const res = { writeHead: (code: number) => ((status = code), { end: () => undefined }) } as unknown as ServerResponse;
        void middleware(req, res);
        expect(status).toBe(403);
    });
});

describe('sat_check', () => {
    const toolCall = async (args: Record<string, unknown>, port = app.port) => {
        const { json } = await call('/__sat/mcp', { port, body: { jsonrpc: '2.0', id: nextId++, method: 'tools/call', params: { name: 'sat_check', arguments: args } } });
        return json.result as { isError?: boolean; content: Array<{ type: string; text?: string; data?: string }>; structuredContent?: { pages: Array<{ changes?: unknown }> } };
    };

    it('refuses other hosts and arguments that are not valid, before opening anything', async () => {
        for (const url of ['http://example.com/', '//example.com/x', `http://localhost:${app.port + 1}/`, 'javascript:alert(1)']) {
            const result = await toolCall({ url });
            expect(result.isError, url).toBe(true);
            expect(result.content[0].text).toContain('only the pages of this dev server');
        }
        const invalid: Array<[Record<string, unknown>, string]> = [
            [{}, 'needs url'],
            [{ url: '/', viewport: { width: 0, height: 10 } }, 'viewport'],
            [{ url: '/', viewport: '800x600' }, 'viewport'],
            [{ url: '/', colorScheme: 'blue' }, 'colorScheme'],
            [{ url: '/', waitFor: 3 }, 'waitFor'],
            [{ url: '/', screenshots: 'yes' }, 'screenshots'],
        ];
        for (const [args, says] of invalid) {
            const result = await toolCall(args);
            expect(result.isError, JSON.stringify(args)).toBe(true);
            expect(result.content[0].text).toContain(says);
        }
    });

    it('says how to install Playwright when the project has none', async () => {
        const empty = mkdtempSync(join(tmpdir(), 'sat-no-playwright-'));
        try {
            await expect(loadChromium([join(empty, 'package.json')])).rejects.toThrow(PLAYWRIGHT_MISSING);
        } finally {
            rmSync(empty, { recursive: true, force: true });
        }
        expect(PLAYWRIGHT_MISSING).toContain('npm install -D playwright');
    });

    describe('with a fake browser', () => {
        let server: Server;
        let port = 0;
        let next: () => Promise<CheckResult>;
        const checked: Array<[string, unknown]> = [];
        const page = (issues: PageResults['issues'], url = `http://localhost:${port}/cart`): CheckResult => ({ results: results(url, issues), images: [] });

        beforeAll(async () => {
            server = createHttpServer(mcpMiddleware({
                store: resultsStore(),
                check: (url, args) => (checked.push([url, args]), next()),
                recheck: () => 0,
                hosts: () => [`localhost:${port}`],
                origins: () => [`http://localhost:${port}`],
            }));
            await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
            port = (server.address() as { port: number }).port;
        });
        afterAll(() => new Promise((resolve) => server.close(resolve)));

        it('checks the address on the dev server and compares with the previous check of the page', async () => {
            next = async () => page([IMG, LINK]);
            const first = await toolCall({ url: '/cart', viewport: { width: 375, height: 667 }, colorScheme: 'dark' }, port);
            expect(checked.at(-1)).toEqual([`http://localhost:${port}/cart`, { viewport: { width: 375, height: 667 }, colorScheme: 'dark' }]);
            expect(first.content[0].text!.startsWith('# Shop')).toBe(true);
            expect(first.structuredContent!.pages[0]).not.toHaveProperty('changes');

            next = async () => page([LINK, IMG, { ...IMG, id: 'image-alt img #2' }]);
            const second = await toolCall({ url: `http://localhost:${port}/cart` }, port);
            expect(second.content[0].text!.startsWith('/cart: 0 fixed, 1 new (image-alt img #2), 2 remaining.')).toBe(true);
            expect(second.structuredContent!.pages[0].changes).toEqual({ fixed: [], new: ['image-alt img #2'], remaining: ['link-text a', 'image-alt img'] });

            next = async () => page([]);
            const third = await toolCall({ url: '/cart' }, port);
            expect(third.content[0].text!.startsWith('/cart: 3 fixed (link-text a; image-alt img; image-alt img #2), 0 new, 0 remaining.')).toBe(true);
        });

        it('a failure the agent can act on is a tool error with its text; a redirect is said', async () => {
            next = () => Promise.reject(new CheckError('The page at /slow did not load within 15 seconds.'));
            const failed = await toolCall({ url: '/slow' }, port);
            expect(failed).toMatchObject({ isError: true, content: [{ text: 'The page at /slow did not load within 15 seconds.' }] });

            next = async () => page([], `http://localhost:${port}/login`);
            const redirected = await toolCall({ url: '/account' }, port);
            expect(redirected.content.map((item) => item.text).join('\n')).toContain('/account redirected to /login');
        });

        it('images come after the text, each one named', async () => {
            next = async () => ({ results: results(`http://localhost:${port}/contrast`, [IMG]), images: [{ issue: IMG, png: 'iVBORw0KGgo=' }] });
            const { content } = await toolCall({ url: '/contrast', screenshots: true }, port);
            expect(content.slice(1)).toEqual([
                { type: 'text', text: 'Image 1: image-alt img (Image without alt)' },
                { type: 'image', data: 'iVBORw0KGgo=', mimeType: 'image/png' },
            ]);
        });
    });
});
