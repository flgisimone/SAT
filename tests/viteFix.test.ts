// @vitest-environment node
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import type { IncomingMessage } from 'node:http';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import { CLAUDE_ARGS, refusal } from '../src/integrations/fixServer';
import { sat, type SATViteOptions } from '../src/integrations/vite';
import type { FixEvent } from '../src/sat/aiFix';

// "Fix with AI" on a real Vite dev server, with tests/fake-claude/claude in place of Claude Code.

const FAKE_CLAUDE = new URL('./fake-claude', import.meta.url).pathname;
const PATH = process.env.PATH;
const root = mkdtempSync(join(tmpdir(), 'sat-fix-'));
const record = join(root, 'record.json');
writeFileSync(join(root, 'index.html'), '<!doctype html><title>App</title><img src="a.png">');

/** A dev server with the plugin, its origin and the token of its SAT module. */
async function devServer(options: SATViteOptions) {
    const plugin = sat(options);
    const server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [plugin], server: { port: 0, host: '127.0.0.1' } });
    await server.listen();
    const code = (plugin.load as (id: string) => string)((plugin.resolveId as (id: string) => string)('virtual:seo-accessibility-tool'));
    const origin = new URL(server.resolvedUrls!.local[0]).origin;
    return { server, origin, token: /"token":"([^"]+)"/.exec(code)?.[1] ?? '' };
}

let ai: Awaited<ReturnType<typeof devServer>>;
const servers: ViteDevServer[] = [];

function post(path: string, { body = { prompt: 'Fix it' }, token = ai.token, origin = ai.origin } = {}) {
    return fetch(`${ai.origin}/__sat/fix${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-sat-token': token, origin },
        body: JSON.stringify(body),
    });
}

async function events(response: Response): Promise<FixEvent[]> {
    return (await response.text()).split('\n').filter(Boolean).map((line) => JSON.parse(line) as FixEvent);
}

beforeAll(async () => {
    ai = await devServer({ ai: true });
    servers.push(ai.server);
});

afterEach(() => {
    process.env.PATH = PATH;
    delete process.env.SAT_FAKE_WAIT;
    delete process.env.SAT_FAKE_RECORD;
});

afterAll(async () => {
    await Promise.all(servers.map((server) => server.close()));
    rmSync(root, { recursive: true, force: true });
});

describe('Fix with AI endpoint', () => {
    it('runs claude -p in the project root with the limited tools, the prompt on stdin, and streams the progress', async () => {
        process.env.PATH = `${FAKE_CLAUDE}${delimiter}${PATH}`;
        process.env.SAT_FAKE_RECORD = record;
        const response = await post('', { body: { prompt: 'Fix the <img> & more\nlines' } });

        expect(response.headers.get('content-type')).toContain('application/x-ndjson');
        expect(await events(response)).toEqual([
            { type: 'message', text: 'Adding the alt text.' },
            { type: 'message', text: 'Read index.html' },
            { type: 'message', text: 'Edit index.html' },
            { type: 'file', path: 'index.html' },
            { type: 'end', ok: true, summary: 'Added alt text to the image.', files: ['index.html'] },
        ]);
        const run = JSON.parse(readFileSync(record, 'utf8')) as { args: string[]; stdin: string; cwd: string };
        expect(run.args).toEqual(CLAUDE_ARGS);
        expect(run.args.join(' ')).toContain('--tools Read,Edit,Grep,Glob --allowedTools Read,Edit,Grep,Glob');
        expect(run.args).not.toContain('Bash');
        expect(run.stdin).toBe('Fix the <img> & more\nlines');
        expect(realpathSync(run.cwd)).toBe(realpathSync(root));
    });

    it('a page reloaded during the fix gets the events again from /stream', async () => {
        process.env.PATH = `${FAKE_CLAUDE}${delimiter}${PATH}`;
        await (await post('')).text();
        const replay = await events(await post('/stream'));
        expect(replay.at(-1)).toMatchObject({ type: 'end', ok: true });
    });

    it('one fix at a time; cancel stops it', async () => {
        process.env.PATH = `${FAKE_CLAUDE}${delimiter}${PATH}`;
        process.env.SAT_FAKE_WAIT = '1';
        const first = post('');
        const response = await first;
        await expect.poll(async () => (await post('')).status).toBe(409);
        expect(await (await post('')).text()).toContain('already running');

        expect((await post('/cancel')).status).toBe(200);
        expect((await events(response)).at(-1)).toEqual({ type: 'end', ok: false, summary: 'Cancelled.', files: expect.any(Array) });
    });

    it('says so when Claude Code is not installed', async () => {
        process.env.PATH = '/nonexistent';
        const [end] = await events(await post(''));
        expect(end).toMatchObject({ type: 'end', ok: false });
        expect((end as { summary: string }).summary).toContain('Claude Code is not installed');
    });

    it('refuses requests without the token, from another origin, without a prompt, or with ai off', async () => {
        process.env.PATH = `${FAKE_CLAUDE}${delimiter}${PATH}`;
        process.env.SAT_FAKE_RECORD = join(root, 'refused.json');

        expect((await post('', { token: 'wrong' })).status).toBe(403);
        expect((await post('', { token: '' })).status).toBe(403);
        expect((await post('', { origin: 'http://evil.test' })).status).toBe(403);
        expect((await post('', { origin: ai.origin.replace(/:\d+$/, ':1') })).status).toBe(403);
        expect((await post('', { body: {} as { prompt: string } })).status).toBe(400);

        const off = await devServer({});
        servers.push(off.server);
        const response = await fetch(`${off.origin}/__sat/fix`, {
            method: 'POST', headers: { 'x-sat-token': off.token, origin: off.origin }, body: '{"prompt":"x"}',
        });
        expect(response.status).toBe(404);
        expect(() => readFileSync(join(root, 'refused.json'))).toThrow();
    });

    it('warns when the repository has uncommitted changes', async () => {
        process.env.PATH = `${FAKE_CLAUDE}${delimiter}${PATH}`;
        execFileSync('git', ['init', '--quiet'], { cwd: root });
        const list = await events(await post(''));
        expect(list).toContainEqual({ type: 'warning', message: expect.stringContaining('uncommitted changes') });
        expect(list.at(-1)).toMatchObject({ type: 'end', ok: true });
    });

    it('accepts loopback connections only', () => {
        const request = (remoteAddress: string) => ({ socket: { remoteAddress }, headers: { origin: 'http://localhost:5173', 'x-sat-token': 't' } }) as unknown as IncomingMessage;
        expect(refusal(request('127.0.0.1'), 't', ['http://localhost:5173'])).toBeUndefined();
        expect(refusal(request('::1'), 't', ['http://localhost:5173'])).toBeUndefined();
        expect(refusal(request('192.168.1.20'), 't', ['http://localhost:5173'])).toContain('this computer only');
    });
});
