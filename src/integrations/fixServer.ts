import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { isAbsolute, relative } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { FixEvent } from '../sat/aiFix';

/** Tools Claude Code gets: it reads and edits files, nothing else (no shell, no web, no MCP servers). */
const TOOLS = 'Read,Edit,Grep,Glob';

/**
 * `--tools` limits the tools Claude Code has, `--allowedTools` lets them run without asking
 * (print mode can't ask). `--allowedTools` alone would leave the tools the user's settings allow.
 */
export const CLAUDE_ARGS = [
    '-p',
    '--output-format', 'stream-json', '--verbose',
    '--tools', TOOLS,
    '--allowedTools', TOOLS,
    '--disallowedTools', 'mcp__*',
    '--strict-mcp-config',
    '--no-session-persistence',
];

const EDIT_TOOLS = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit']);
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const MAX_BODY = 1_000_000;
const MAX_TEXT = 300;

const NOT_INSTALLED = 'Claude Code is not installed or not in the PATH. Install it from https://code.claude.com/docs/en/setup and sign in with `claude`.';
const DIRTY = 'The repository has uncommitted changes: commit or stash them to undo the fix with git.';

interface Fix {
    child?: ChildProcess;
    events: FixEvent[];
    clients: Set<ServerResponse>;
    files: string[];
    ended: boolean;
}

type Next = (error?: unknown) => void;

/** A line of what Claude Code prints with `--output-format stream-json` (only the fields SAT reads). */
interface ClaudeLine {
    type?: string;
    subtype?: string;
    is_error?: boolean;
    result?: string;
    message?: { content?: Array<{ type?: string; text?: string; name?: string; input?: Record<string, unknown> }> };
}

function short(text: string): string {
    const line = text.replace(/\s+/g, ' ').trim();
    return line.length > MAX_TEXT ? `${line.slice(0, MAX_TEXT)}…` : line;
}

function send(res: ServerResponse, status: number, message: string): void {
    res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' }).end(message);
}

function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.setEncoding('utf8');
        req.on('data', (chunk: string) => {
            body += chunk;
            if (body.length > MAX_BODY) reject(new Error('Prompt too long.'));
        });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

/**
 * Why the request is refused, if it is: only pages of the dev server, opened on this computer,
 * with the token the plugin put in their SAT module, may start Claude Code.
 */
export function refusal(req: IncomingMessage, token: string, origins: string[]): string | undefined {
    if (!LOOPBACK.has(req.socket.remoteAddress ?? '')) return 'Fix with AI accepts requests from this computer only.';
    if (!req.headers.origin || !origins.includes(req.headers.origin)) return "Fix with AI accepts requests from the dev server's pages only.";
    if (req.headers['x-sat-token'] !== token) return 'Invalid SAT token: reload the page.';
    return undefined;
}

/**
 * The endpoint behind "Fix with AI", for `POST` only:
 * - `/` with `{ prompt }` runs `claude -p` in `root` with the prompt on stdin and streams the progress (NDJSON `FixEvent`s);
 * - `/stream` replays the events of the current or last fix and follows it (a page reloaded during a fix);
 * - `/cancel` stops the running fix.
 * One fix at a time. The process doesn't depend on the connection: a reload must not stop it.
 */
export function fixMiddleware(root: string, token: string, origins: () => string[]) {
    let fix: Fix | undefined;

    const emit = (event: FixEvent) => {
        if (!fix || fix.ended) return;
        fix.events.push(event);
        const line = `${JSON.stringify(event)}\n`;
        fix.clients.forEach((client) => client.write(line));
        if (event.type === 'end') {
            fix.ended = true;
            fix.clients.forEach((client) => client.end());
        }
    };

    const end = (ok: boolean, summary: string) => emit({ type: 'end', ok, summary, files: fix?.files ?? [] });

    const follow = (res: ServerResponse) => {
        res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' });
        fix!.events.forEach((event) => res.write(`${JSON.stringify(event)}\n`));
        if (fix!.ended) return res.end();
        fix!.clients.add(res);
        res.on('close', () => fix?.clients.delete(res));
    };

    const read = (line: ClaudeLine, result: { ok: boolean; summary: string }) => {
        if (line.type === 'result') {
            result.ok = line.subtype === 'success' && !line.is_error;
            result.summary = line.result ?? '';
            return;
        }
        if (line.type !== 'assistant') return;

        for (const block of line.message?.content ?? []) {
            if (block.type === 'text' && block.text?.trim()) emit({ type: 'message', text: short(block.text) });
            if (block.type !== 'tool_use' || !block.name) continue;

            const target = String(block.input?.file_path ?? block.input?.pattern ?? '');
            const path = isAbsolute(target) ? relative(root, target) : target;
            emit({ type: 'message', text: short(`${block.name} ${path}`) });
            if (EDIT_TOOLS.has(block.name) && path && !fix!.files.includes(path)) {
                fix!.files.push(path);
                emit({ type: 'file', path });
            }
        }
    };

    const start = (prompt: string) => {
        fix = { events: [], clients: new Set(), files: [], ended: false };
        const current = fix;

        // The warning comes first; outside a git repository there is none.
        execFile('git', ['status', '--porcelain'], { cwd: root }, (error, stdout) => {
            if (!error && stdout.trim()) emit({ type: 'warning', message: DIRTY });
            if (fix === current && !current.ended) run(prompt, current);
        });
    };

    const run = (prompt: string, current: Fix) => {
        // Windows installs `claude.cmd`, which only a shell runs; the prompt goes through stdin, never through the shell.
        const child = spawn('claude', CLAUDE_ARGS, { cwd: root, shell: process.platform === 'win32' });
        current.child = child;
        const result = { ok: false, summary: '' };
        let stderr = '';
        let buffer = '';

        child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop()!;
            for (const text of lines) {
                try {
                    if (fix === current) read(JSON.parse(text) as ClaudeLine, result);
                } catch {
                    // not a JSON line (a warning printed by the CLI): ignored
                }
            }
        });
        child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr = (stderr + chunk).slice(-2000)));
        child.stdin.on('error', () => undefined); // the process exited before reading the prompt: 'close' reports it
        child.stdin.end(prompt);

        child.on('error', (error: NodeJS.ErrnoException) => {
            if (fix === current) end(false, error.code === 'ENOENT' ? NOT_INSTALLED : error.message);
        });
        child.on('close', (code) => {
            if (fix !== current) return;
            if (result.summary || code === 0) end(result.ok && code === 0, result.summary);
            else end(false, short(stderr) || `Claude Code exited with code ${code}.`);
        });
    };

    return async (req: IncomingMessage, res: ServerResponse, next: Next) => {
        if (req.method !== 'POST') return next();
        const why = refusal(req, token, origins());
        if (why) return send(res, 403, why);

        const path = (req.url ?? '/').split('?')[0];
        if (path === '/cancel') {
            if (fix && !fix.ended) {
                // ponytail: on Windows this stops the shell that started claude.cmd, not always Claude Code itself;
                // if it keeps running there, kill the process tree (`taskkill /T`).
                fix.child?.kill();
                end(false, 'Cancelled.');
            }
            return send(res, 200, 'OK');
        }
        if (path === '/stream') return fix ? follow(res) : send(res, 404, 'No fix to follow.');
        if (path !== '/') return next();

        let prompt: unknown;
        try {
            prompt = (JSON.parse(await readBody(req)) as { prompt?: unknown }).prompt;
        } catch {
            return send(res, 400, 'Expected JSON with a prompt.');
        }
        if (typeof prompt !== 'string' || !prompt.trim()) return send(res, 400, 'Expected JSON with a prompt.');

        // Checked after reading the body: another request may have started a fix meanwhile.
        if (fix && !fix.ended) return send(res, 409, 'A fix is already running: wait for it to end or cancel it.');
        start(prompt);
        follow(res);
    };
}
