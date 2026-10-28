/**
 * Where an issue sent to the agent is: in the queue, taken by the agent (`sat_issues` returned it),
 * fixed (gone from the page's results) or verified (gone after `sat_check` or `sat_recheck`).
 */
export type AgentState = 'queued' | 'taken' | 'fixed' | 'verified';

/** An issue the user sent to the agent from the panel. */
export interface QueuedIssue {
    /** The issue's id (see `issueIds`). */
    id: string;
    title?: string;
    message: string;
    /** `fixPrompt` of the issue, made by the page, which has the element. */
    prompt: string;
    state: AgentState;
}

/** What the panel sends to `POST /__sat/queue`: issues to add, ids to remove. */
export interface QueueChange {
    url: string;
    add?: Array<Omit<QueuedIssue, 'state'>>;
    remove?: string[];
}

/** What the dev server sends to the pages (HMR event `sat:status`) when the queue of a page changes. */
export interface AgentStatus {
    /** Path and query of the page. */
    page: string;
    issues: QueuedIssue[];
}

/** Path and query of a page, from an address or a path: the same page under localhost or 127.0.0.1 is one page. */
export function pageKey(url: string): string {
    const { pathname, search } = new URL(url, 'http://localhost');
    return pathname + search;
}
