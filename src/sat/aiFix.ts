import { fixPrompt } from '../core/fixPrompt';
import type { Issue } from './issue';

/** Where the Vite plugin (`ai: true`) serves the fix endpoint, and the token of this dev server run. */
export interface AIFixEndpoint {
    url: string;
    token: string;
}

/** What the fix endpoint streams, one JSON object per line. */
export type FixEvent =
    | { type: 'warning'; message: string }
    | { type: 'message'; text: string }
    | { type: 'file'; path: string }
    | { type: 'end'; ok: boolean; summary: string; files: string[] };

/** What the panel shows about the current fix. */
export interface FixView {
    title: string;
    state: 'running' | 'checking' | 'fixed' | 'still-present' | 'failed';
    /** Last messages of the agent, oldest first. */
    messages: string[];
    files: string[];
    warning?: string;
    summary?: string;
}

/** The fix asked from this tab, kept across the reloads the fix itself may cause. */
interface PendingFix {
    ruleId: string;
    title: string;
    /** Selector (or message, without an element) of each issue to fix. */
    targets: string[];
}

const PENDING_KEY = 'sat-fix';
/** Messages of the agent the panel keeps. */
const LAST_MESSAGES = 3;
/**
 * Time Vite gets to apply the edits (HMR) before the checks run again.
 * ponytail: a fixed delay; if it proves too short, listen to `vite:afterUpdate` in the plugin's module instead.
 */
const HMR_DELAY = 1000;

const issueKey = (issue: Issue) => issue.selector ?? issue.message;

function storedPending(): PendingFix | undefined {
    try {
        const value = JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? 'null') as PendingFix | null;
        return value && typeof value.ruleId === 'string' && Array.isArray(value.targets) ? value : undefined;
    } catch {
        return undefined;
    }
}

function storePending(pending: PendingFix | undefined): void {
    try {
        if (pending) sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
        else sessionStorage.removeItem(PENDING_KEY);
    } catch {
        // storage unavailable: a reload during the fix loses its result
    }
}

async function post(endpoint: AIFixEndpoint, path: string, body?: unknown): Promise<Response> {
    return fetch(endpoint.url + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-sat-token': endpoint.token },
        body: JSON.stringify(body ?? {}),
    });
}

/** Reads the NDJSON stream of the endpoint and calls `onEvent` for each event. */
async function follow(response: Response, onEvent: (event: FixEvent) => void): Promise<void> {
    if (!response.ok || !response.body) throw new Error((await response.text()) || `Request failed (${response.status}).`);
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';
    for (;;) {
        const { value, done } = await reader.read();
        buffer += value ?? '';
        const lines = buffer.split('\n');
        // A line without its newline yet waits for the next chunk, unless the stream is over.
        buffer = done ? '' : lines.pop()!;
        lines.filter((line) => line.trim()).forEach((line) => onEvent(JSON.parse(line) as FixEvent));
        if (done) return;
    }
}

export interface FixController {
    /** Asks the agent to fix these issues (one rule). */
    fix(issues: Issue[]): void;
    cancel(): void;
    /** Called with the results of every run: after a fix, tells whether the issues are gone. */
    checked(issues: Issue[]): void;
    /** Follows a fix this tab started before a reload. */
    resume(): void;
}

/**
 * "Fix with AI": sends the prompt to the Vite plugin's endpoint, shows the progress,
 * then runs the checks again (`rerun`) and reports "Fixed" or "Still present".
 */
export function createFixController(endpoint: AIFixEndpoint, show: (view: FixView | null) => void, rerun: () => void): FixController {
    let view: FixView | null = null;
    let busy = false;
    let awaitingCheck = false;

    const update = (changes: Partial<FixView>) => {
        view = { ...view!, ...changes };
        show(view);
    };

    const onEvent = (event: FixEvent) => {
        if (event.type === 'warning') update({ warning: event.message });
        if (event.type === 'message') update({ messages: [...view!.messages, event.text].slice(-LAST_MESSAGES) });
        if (event.type === 'file') update({ files: [...view!.files, event.path] });
        if (event.type !== 'end') return;

        busy = false;
        if (!event.ok) {
            storePending(undefined);
            update({ state: 'failed', summary: event.summary, files: event.files });
            return;
        }
        update({ state: 'checking', summary: event.summary, files: event.files });
        awaitingCheck = true;
        setTimeout(rerun, HMR_DELAY);
    };

    const run = async (request: Promise<Response>) => {
        busy = true;
        try {
            await follow(await request, onEvent);
        } catch (error) {
            storePending(undefined);
            update({ state: 'failed', summary: error instanceof Error ? error.message : String(error) });
        } finally {
            if (view?.state === 'running') update({ state: 'failed', summary: 'The connection to the dev server was lost.' });
            busy = false;
        }
    };

    return {
        fix(issues) {
            if (busy || issues.length === 0) return;
            const [first] = issues;
            const pending = { ruleId: first.ruleId, title: first.title ?? first.ruleId, targets: issues.map(issueKey) };
            storePending(pending);
            view = { title: pending.title, state: 'running', messages: [], files: [] };
            show(view);
            void run(post(endpoint, '', { prompt: fixPrompt(issues, { url: location.href }) }));
        },

        cancel() {
            if (busy) void post(endpoint, '/cancel').catch(() => undefined);
            else {
                view = null;
                show(null);
            }
        },

        checked(issues) {
            const pending = storedPending();
            if (!awaitingCheck || !pending) return;
            awaitingCheck = false;
            storePending(undefined);
            const left = issues.filter((issue) => issue.ruleId === pending.ruleId && pending.targets.includes(issueKey(issue)));
            update({ state: left.length ? 'still-present' : 'fixed' });
        },

        resume() {
            const pending = storedPending();
            if (!pending || busy) return;
            view = { title: pending.title, state: 'running', messages: [], files: [] };
            show(view);
            void run(post(endpoint, '/stream'));
        },
    };
}
