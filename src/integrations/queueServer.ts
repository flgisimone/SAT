import type { IncomingMessage, ServerResponse } from 'node:http';
import { pageKey, type AgentState, type QueueChange, type QueuedIssue } from '../sat/agentQueue';
import { readBody, refusal, send } from './fixServer';

const OPEN = new Set<AgentState>(['queued', 'taken']);

/**
 * The issues the user sent to the agent from the panel, by page (`pageKey`), with their state.
 * Fixed and verified issues leave the queue but stay listed, for the panel, until the user removes them.
 * `onChange` gets the issues of a page after every change. ponytail: in memory, for this run of the dev server.
 */
export function agentQueue(onChange: (page: string, issues: QueuedIssue[]) => void) {
    const pages = new Map<string, Map<string, QueuedIssue>>();
    const list = (page: string) => [...(pages.get(page)?.values() ?? [])];
    const notify = (page: string) => onChange(page, list(page));

    return {
        list,
        /** The issues still waiting for the agent: of one page, or of all of them. */
        open(url?: string): Array<QueuedIssue & { page: string }> {
            const keys = url === undefined ? [...pages.keys()] : [pageKey(url)];
            return keys.flatMap((page) => list(page).filter((issue) => OPEN.has(issue.state)).map((issue) => ({ ...issue, page })));
        },
        change({ url, add = [], remove = [] }: QueueChange) {
            const page = pageKey(url);
            const issues = pages.get(page) ?? new Map<string, QueuedIssue>();
            add.forEach((issue) => issues.set(issue.id, { ...issue, state: 'queued' }));
            remove.forEach((id) => issues.delete(id));
            if (issues.size) pages.set(page, issues);
            else pages.delete(page);
            notify(page);
        },
        /** The agent got these issues of the page (`sat_issues`). */
        take(url: string, ids: string[]) {
            const issues = pages.get(pageKey(url));
            const taken = ids.map((id) => issues?.get(id)).filter((issue) => issue?.state === 'queued');
            taken.forEach((issue) => (issue!.state = 'taken'));
            if (taken.length) notify(pageKey(url));
        },
        /**
         * New results of the page: the issues sent that are gone are fixed, or verified when the agent checked (`verified`).
         * Tells the page its issues even when nothing changed: a page reloaded by a fix gets them back.
         */
        checked(url: string, ids: string[], verified: boolean) {
            const issues = pages.get(pageKey(url));
            if (!issues) return;
            const present = new Set(ids);
            issues.forEach((issue) => {
                if (present.has(issue.id) || issue.state === 'verified') return;
                if (verified) issue.state = 'verified';
                else if (OPEN.has(issue.state)) issue.state = 'fixed';
            });
            notify(pageKey(url));
        },
    };
}

export type AgentQueue = ReturnType<typeof agentQueue>;

const isText = (value: unknown) => typeof value === 'string' && value.length > 0;

function isQueueChange(value: unknown): value is QueueChange {
    const change = value as QueueChange | null;
    if (!isText(change?.url)) return false;
    const { add = [], remove = [] } = change!;
    return Array.isArray(add) && Array.isArray(remove) && remove.every(isText)
        && add.every((issue) => isText(issue?.id) && isText(issue.message) && isText(issue.prompt) && (issue.title === undefined || typeof issue.title === 'string'));
}

/** `POST /__sat/queue`: the panel adds issues to the agent's queue or removes them (same protection as the results). */
export function queueMiddleware(queue: AgentQueue, token: string, origins: () => string[]) {
    return async (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => {
        if (req.method !== 'POST') return next();
        const why = refusal(req, token, origins());
        if (why) return send(res, 403, why);
        let change: unknown;
        try {
            change = JSON.parse(await readBody(req));
        } catch {
            return send(res, 400, 'Expected JSON with url, add and remove.');
        }
        if (!isQueueChange(change)) return send(res, 400, 'Expected JSON with url, add and remove.');
        // Only the fields SAT reads.
        const add = (change.add ?? []).map(({ id, title, message, prompt }) => ({ id, ...(title && { title }), message, prompt }));
        queue.change({ url: change.url, add, remove: change.remove });
        res.writeHead(204).end();
    };
}
