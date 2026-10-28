import { componentSource, fixPrompt } from '../core/fixPrompt';
import type { AgentStatus, QueueChange } from './agentQueue';
import { issueIds, type Issue, type Severity } from './issue';

/**
 * Where the Vite plugin (`mcp: true`) takes the results of the page, the token of this dev server run,
 * and how the page hears that an agent asked for a new check (`sat_recheck`).
 */
export interface MCPEndpoint {
    url: string;
    token: string;
    /** Calls `run` when the dev server asks the open pages to check again. */
    listen?: (run: () => void) => void;
    /** Where "Send to agent" adds issues to the agent's queue. */
    queue?: string;
    /** Calls `show` when the issues sent to the agent change state. */
    status?: (show: (status: AgentStatus) => void) => void;
}

/** One issue as the agent gets it: the element itself stays in the page, its HTML is in the prompt. */
export interface ReportedIssue {
    /** Same issue, same id between runs: rule and selector (see `issueIds`). */
    id: string;
    ruleId: string;
    severity: Severity;
    title?: string;
    message: string;
    selector?: string;
    /** Source file of the component that renders the element (Vue, Svelte, React), with the line when known. */
    component?: string;
    help?: string;
    /** Sent by the user from the panel ("Send to agent"): `sat_issues` returns it first. */
    requested?: boolean;
}

/** What a page sends to the dev server after every run. */
export interface PageResults {
    url: string;
    title: string;
    /** `fixPrompt` for all the issues, empty when there are none. */
    prompt: string;
    issues: ReportedIssue[];
}

export function pageResults(issues: Issue[]): PageResults {
    const url = location.href.split('#')[0];
    const ids = issueIds(issues);
    return {
        url,
        title: document.title,
        prompt: issues.length ? fixPrompt(issues, { url }) : '',
        issues: issues.map(({ ruleId, severity, title, message, selector, element, help }, index) => {
            const component = element && componentSource(element);
            return { id: ids[index], ruleId, severity, title, message, selector, ...(component && { component }), help };
        }),
    };
}

/** Sends the results to the dev server; a dev server that is gone is not the page's problem. */
export function sendResults(endpoint: MCPEndpoint, issues: Issue[]): void {
    void fetch(endpoint.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-sat-token': endpoint.token },
        body: JSON.stringify(pageResults(issues)),
    }).catch(() => undefined);
}

/** Adds issues to the agent's queue or removes them; false when the dev server refused or is gone. */
export async function changeQueue(endpoint: MCPEndpoint, change: QueueChange): Promise<boolean> {
    if (!endpoint.queue) return false;
    try {
        const response = await fetch(endpoint.queue, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-sat-token': endpoint.token },
            body: JSON.stringify(change),
        });
        return response.ok;
    } catch {
        return false;
    }
}
