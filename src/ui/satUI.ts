import { fixPrompt } from '../core/fixPrompt';
import type { OutlineHeading } from '../core/rules/headings';
import type { AgentState, QueueChange, QueuedIssue } from '../sat/agentQueue';
import type { FixView } from '../sat/aiFix';
import { issueIds, type Category, type Issue, type Severity } from '../sat/issue';
import { icon, type IconName } from './icons';
import { createOverlay } from './overlay';
import { STYLES } from './styles';

export interface SATUI {
    /** Goes in the page; everything else is in its shadow root. */
    host: HTMLElement;
    setRunning(running: boolean): void;
    /** `duration`: how long the checks took, in milliseconds. */
    showResults(issues: Issue[], outline: OutlineHeading[], duration?: number): void;
    clearHighlights(): void;
    /** Shows the progress and result of "Fix with AI" (`null` hides it). */
    showFix(view: FixView | null): void;
    /** Shows the issues sent to the agent of this page, with their state. */
    showAgent(issues: QueuedIssue[]): void;
}

/** "Fix with AI" actions: present only when the Vite plugin runs with `ai: true`. */
export interface FixActions {
    fix(issues: Issue[]): void;
    /** Stops the running fix, or dismisses the result of the last one. */
    cancel(): void;
}

/** "Send to agent": present only when the Vite plugin runs with `mcp: true`. */
export interface AgentActions {
    /** Changes the agent's queue of this page; resolves false when the dev server can't be reached. */
    change(change: Omit<QueueChange, 'url'>): Promise<boolean>;
}

/** What the panel offers besides the checks. */
export interface PanelActions {
    fix?: FixActions;
    agent?: AgentActions;
    /** Shows, until closed, how to turn on "Send to agent" (Vite plugin without `mcp` and `ai`). */
    suggestMcp?: boolean;
}

type Filter = Severity | Category;
type Side = 'left' | 'right';

const FILTERS: Array<[Filter, string]> = [
    ['error', 'Errors'],
    ['warning', 'Warnings'],
    ['a11y', 'Accessibility'],
    ['seo', 'SEO'],
];

const CATEGORIES: Array<[Category, string]> = [
    ['a11y', 'Accessibility'],
    ['seo', 'SEO'],
];

/** Issues listed per rule before "Show N more". */
const FIRST_ISSUES = 5;
const SIDE_KEY = 'sat-side';
const HINT_KEY = 'sat-mcp-hint';
/** How long a confirmation such as "Copied" stays visible. */
const NOTICE_TIME = 3000;

const FIX_STATUS: Record<FixView['state'], (view: FixView) => string> = {
    running: () => 'Fixing…',
    checking: () => 'Checking the page again…',
    fixed: () => 'Fixed',
    'still-present': () => 'Still present',
    failed: (view) => (view.summary === 'Cancelled.' ? 'Fix cancelled' : 'Fix failed'),
};

const AGENT_STATUS: Record<AgentState, string> = {
    queued: 'Queued',
    taken: 'Taken by the agent',
    fixed: 'Fixed',
    verified: 'Verified',
};

const isOpen = (issue: QueuedIssue | undefined) => issue?.state === 'queued' || issue?.state === 'taken';

function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props: Partial<HTMLElementTagNameMap[K]> = {},
    ...children: Array<Node | string>
): HTMLElementTagNameMap[K] {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
}

function button(className: string, onClick: () => void, ...children: Array<Node | string>): HTMLButtonElement {
    const node = el('button', { type: 'button', className }, ...children);
    node.addEventListener('click', onClick);
    return node;
}

/** An icon-only button: the label is its accessible name. */
function iconButton(className: string, name: IconName, label: string, onClick: () => void): HTMLButtonElement {
    const node = button(className, onClick, icon(name));
    node.setAttribute('aria-label', label);
    return node;
}

function plural(count: number, word: string): string {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function severityIcon(severity: Severity): SVGSVGElement {
    return icon(severity, severity === 'error' ? 'Error' : 'Warning');
}

function agentStatus(state: AgentState): HTMLSpanElement {
    return el('span', { className: `agent-status ${state}` }, icon(state), AGENT_STATUS[state]);
}

function hintClosed(): boolean {
    try {
        return localStorage.getItem(HINT_KEY) === 'closed';
    } catch {
        return false;
    }
}

function closeHint(): void {
    try {
        localStorage.setItem(HINT_KEY, 'closed');
    } catch {
        // storage unavailable: the hint comes back on reload
    }
}

function storedSide(): Side {
    try {
        return localStorage.getItem(SIDE_KEY) === 'right' ? 'right' : 'left';
    } catch {
        return 'left';
    }
}

function storeSide(side: Side): void {
    try {
        if (side === 'right') localStorage.setItem(SIDE_KEY, side);
        else localStorage.removeItem(SIDE_KEY);
    } catch {
        // storage unavailable: the panel goes back to the left on reload
    }
}

/**
 * The in-page UI: a dock (run/stop, run again, results) and a results panel with a summary
 * whose counters filter the issues, the issues by category and rule, and the heading structure.
 * Built in a shadow root.
 */
export function createSATUI(onToggle: () => void, onRerun: () => void, { fix: fixActions, agent: agentActions, suggestMcp }: PanelActions = {}): SATUI {
    const host = document.createElement('sat-panel');
    host.setAttribute('data-sat-ignore', '');
    const root = host.attachShadow({ mode: 'open' });

    const layer = el('div', { className: 'layer' });
    layer.setAttribute('aria-hidden', 'true');
    const overlay = createOverlay(layer, host);

    const runButton = button('icon run', onToggle);
    runButton.id = 'sat-run-button';
    const rerunButton = iconButton('icon', 'rerun', 'Run SAT checks again', onRerun);
    const resultsButton = button('results', () => setPanelOpen(panel.hidden === true));
    resultsButton.setAttribute('aria-controls', 'sat-results');

    const time = el('span', { className: 'time' });
    const sideButton = iconButton('ghost', 'right', '', () => setSide(side === 'left' ? 'right' : 'left'));
    const closeButton = iconButton('ghost', 'close', 'Close SAT results', () => setPanelOpen(false, true));
    // Confirmations for screen readers: "Copied" is visible too, the fix status is already in its box.
    const live = el('span', { className: 'live' });
    live.setAttribute('role', 'status');

    const promptText = el('textarea', { id: 'sat-prompt', readOnly: true, rows: 6 });
    const promptBox = el('div', { className: 'prompt-box', hidden: true },
        el('div', { className: 'box-head' },
            el('label', { htmlFor: 'sat-prompt', textContent: 'Clipboard unavailable: copy the fix prompt from here' }),
            iconButton('ghost', 'close', 'Close fix prompt', () => (promptBox.hidden = true)),
        ),
        promptText,
    );
    const fixBox = el('div', { className: 'fix', hidden: true });
    const agentBox = el('div', { className: 'agent', hidden: true });
    const hint = el('div', { className: 'hint', hidden: !suggestMcp || hintClosed() },
        el('div', { className: 'box-head' },
            el('p', {}, 'Send issues to your AI agent: add ', el('code', { textContent: 'sat({ mcp: true })' }), ' to vite.config.'),
            iconButton('ghost', 'close', 'Close hint', () => {
                hint.hidden = true;
                closeHint();
                closeButton.focus();
            }),
        ),
    );

    const shown = new Map<Filter, boolean>(FILTERS.map(([filter]) => [filter, true]));
    const counters = new Map<Filter, HTMLButtonElement>();
    const summary = el('div', { className: 'summary' }, ...FILTERS.map(([filter, label]) => {
        const counter = button('counter', () => {
            shown.set(filter, !shown.get(filter));
            counter.setAttribute('aria-pressed', String(shown.get(filter)));
            renderIssues();
        }, el('span', { className: 'count', textContent: '0' }), ' ', el('span', {}, icon(filter), label));
        counter.setAttribute('aria-pressed', 'true');
        counters.set(filter, counter);
        return counter;
    }));
    summary.setAttribute('role', 'group');
    summary.setAttribute('aria-label', 'Show issues');

    const issuesCount = el('span', { className: 'pill' });
    const structureCount = el('span', { className: 'pill' });
    const issuesTab = button('tab', () => showTab('issues'), 'Issues ', issuesCount);
    const structureTab = button('tab', () => showTab('structure'), 'Structure ', structureCount);
    const issuesView = el('div', { className: 'view' });
    const structureView = el('div', { className: 'view', hidden: true });

    const panel = el('section', { id: 'sat-results', className: 'panel', hidden: true },
        el('div', { className: 'header' }, el('span', { className: 'brand' }, icon('brand'), 'SAT', time), live, sideButton, closeButton),
        summary,
        hint,
        promptBox,
        fixBox,
        agentBox,
        el('div', { className: 'tabs' }, issuesTab, structureTab),
        issuesView,
        structureView,
    );
    panel.setAttribute('aria-label', 'SAT results');

    const dock = el('div', { className: 'dock' }, runButton, rerunButton, resultsButton);
    // A constructed sheet instead of <style>: a page's CSP `style-src` doesn't block it.
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(STYLES);
    root.adoptedStyleSheets = [sheet];
    root.append(layer, dock, panel);

    let issues: Issue[] = [];
    let side: Side = 'left';
    let noticeTimer: ReturnType<typeof setTimeout> | undefined;
    let fixState: FixView['state'] | undefined;
    const expanded = new Set<string>();
    /** Id of each issue shown (see `issueIds`): the agent's queue knows the issues by it. */
    let ids = new Map<Issue, string>();
    /** The issues sent to the agent, by id. */
    let sent = new Map<string, QueuedIssue>();
    /** "Send to agent" buttons and states of the issues on screen, by id. */
    let agentControls = new Map<string, { toggle: HTMLButtonElement; status: HTMLElement }>();

    function announce(text: string, { keep = false, visible = true } = {}) {
        clearTimeout(noticeTimer);
        live.textContent = text;
        live.classList.toggle('sr-only', !visible);
        if (!keep) noticeTimer = setTimeout(() => (live.textContent = ''), NOTICE_TIME);
    }

    /** Copies the fix prompt; where the clipboard is unavailable (insecure page, permission denied) shows it selected. */
    async function copyPrompt(list: Issue[]) {
        const prompt = fixPrompt(list, { url: location.href });
        try {
            await navigator.clipboard.writeText(prompt);
            promptBox.hidden = true;
            announce('Copied');
        } catch {
            promptText.value = prompt;
            promptBox.hidden = false;
            promptText.focus();
            promptText.select();
        }
    }

    /** Adds the issues to the agent's queue, or removes them (`send` false). */
    async function sendToAgent(list: Issue[], send: boolean) {
        const url = location.href;
        const change = send
            ? { add: list.map((issue) => ({ id: ids.get(issue)!, ...(issue.title && { title: issue.title }), message: issue.message, prompt: fixPrompt(issue, { url }) })) }
            : { remove: list.map((issue) => ids.get(issue)!) };
        const done = await agentActions!.change(change);
        if (!done) announce('The dev server is not reachable: reload the page');
        else announce(send ? `Sent to agent: ${plural(list.length, 'issue')}` : 'Removed from the agent queue');
    }

    /** "Send to agent" (toggle) for one issue, then the shortcut for Claude Code, then the prompt to copy. */
    function issueActions(issue: Issue): HTMLButtonElement[] {
        const actions: HTMLButtonElement[] = [];
        if (agentActions) {
            const toggle = iconButton('ghost send', 'send', 'Send to agent', () => void sendToAgent([issue], toggle.getAttribute('aria-pressed') !== 'true'));
            actions.push(toggle);
        }
        if (fixActions) actions.push(iconButton('ghost', 'fix', 'Fix with Claude Code', () => fixActions.fix([issue])));
        actions.push(iconButton('ghost', 'copy', 'Copy fix prompt', () => void copyPrompt([issue])));
        return actions;
    }

    /** The state of each issue on screen that was sent, and its button pressed while the agent has it. */
    function updateAgentControls() {
        agentControls.forEach(({ toggle, status }, id) => {
            const issue = sent.get(id);
            toggle.setAttribute('aria-pressed', String(isOpen(issue)));
            status.replaceChildren(...(issue ? [agentStatus(issue.state)] : []));
        });
    }

    function showAgent(list: QueuedIssue[]) {
        const before = sent;
        sent = new Map(list.map((issue) => [issue.id, issue]));
        updateAgentControls();

        agentBox.hidden = list.length === 0;
        const done = list.filter((issue) => !isOpen(issue));
        const clear = button('link', () => {
            void agentActions?.change({ remove: done.map((issue) => issue.id) });
            closeButton.focus();
        }, 'Clear done');
        clear.hidden = done.length === 0;
        agentBox.replaceChildren(
            el('div', { className: 'box-head' }, el('p', {}, el('strong', { textContent: 'Sent to agent' }), ` · ${list.length}`), clear),
            el('ul', { className: 'agent-list' }, ...list.map((issue) => el('li', {}, agentStatus(issue.state), el('span', { textContent: issue.title ?? issue.message })))),
        );

        // Only what the agent did: sending is announced by the button.
        const changed = list.filter((issue) => before.has(issue.id) && before.get(issue.id)!.state !== issue.state);
        if (changed.length) announce(changed.map((issue) => `${AGENT_STATUS[issue.state]}: ${issue.title ?? issue.message}`).join('. '), { visible: false });
    }

    function showFix(view: FixView | null) {
        fixBox.hidden = !view;
        if (!view) {
            fixState = undefined;
            fixBox.replaceChildren();
            return;
        }

        const status = FIX_STATUS[view.state](view);
        const running = view.state === 'running' || view.state === 'checking';
        const parts: Node[] = [
            el('div', { className: 'box-head' },
                el('p', { className: `fix-status ${view.state}` }, el('strong', { textContent: status }), ` · ${view.title}`),
                button('link', () => fixActions?.cancel(), running ? 'Cancel' : 'Dismiss'),
            ),
        ];
        if (view.warning) parts.push(el('p', { className: 'fix-warning' }, severityIcon('warning'), ' ', view.warning));
        if (running && view.messages.length) parts.push(el('ul', { className: 'fix-log' }, ...view.messages.map((text) => el('li', { textContent: text }))));
        if (view.files.length) {
            parts.push(el('p', { className: 'fix-label', textContent: 'Files changed:' }), el('ul', { className: 'fix-files' }, ...view.files.map((file) => el('li', { textContent: file }))));
        }
        if (view.summary && (view.state === 'still-present' || view.state === 'failed')) parts.push(el('p', { className: 'fix-summary', textContent: view.summary }));
        fixBox.replaceChildren(...parts);

        if (view.state !== fixState) announce(`${status} ${view.title}`, { keep: running, visible: false });
        fixState = view.state;
        if (panel.hidden) setPanelOpen(true);
    }

    function setPanelOpen(open: boolean, returnFocus = false) {
        panel.hidden = !open;
        resultsButton.setAttribute('aria-expanded', String(open));
        if (returnFocus) resultsButton.focus();
    }

    function setSide(newSide: Side) {
        side = newSide;
        dock.classList.toggle('right', side === 'right');
        panel.classList.toggle('right', side === 'right');
        const other = side === 'left' ? 'right' : 'left';
        sideButton.replaceChildren(icon(other));
        sideButton.setAttribute('aria-label', `Move SAT to the ${other}`);
        storeSide(side);
    }

    function showTab(tab: 'issues' | 'structure') {
        issuesView.hidden = tab !== 'issues';
        structureView.hidden = tab !== 'structure';
        issuesTab.setAttribute('aria-pressed', String(tab === 'issues'));
        structureTab.setAttribute('aria-pressed', String(tab === 'structure'));
    }

    function issueItem(issue: Issue): HTMLLIElement {
        const element = issue.element;
        const content = element ? button('item', () => overlay.reveal(element)) : el('div', { className: 'item' });
        content.append(severityIcon(issue.severity), ' ', el('span', { textContent: issue.message }));
        const actions = issueActions(issue);
        if (agentActions) {
            const status = el('span', { className: 'agent-state' });
            content.append(status);
            agentControls.set(ids.get(issue)!, { toggle: actions[0], status });
        }
        return el('li', { className: 'row' }, content, ...actions);
    }

    /** One rule: readable title, worst severity, count, WCAG criteria or source, docs link, the first issues. */
    function ruleCard(ruleId: string, list: Issue[]): HTMLElement {
        const first = list[0];
        const title = first.title ?? ruleId;
        const worst = list.some((issue) => issue.severity === 'error') ? 'error' : 'warning';
        const labels = first.wcag?.length ? first.wcag.map((criterion) => `WCAG ${criterion}`) : first.source ? [first.source] : [];

        const head = el('div', { className: 'rule-head' },
            severityIcon(worst),
            el('span', { className: 'rule-title', textContent: title }),
            el('span', { className: 'pill', textContent: String(list.length) }),
            ...labels.map((label) => el('span', { className: 'chip', textContent: label })),
        );
        const actions = el('div', { className: 'rule-actions' });
        if (first.help) {
            const docs = el('a', { className: 'docs', href: first.help, target: '_blank', rel: 'noopener noreferrer' }, 'Why and how to fix', icon('external'));
            docs.setAttribute('aria-label', `Why and how to fix: ${title} (opens in a new tab)`);
            actions.append(docs);
        }
        if (agentActions) {
            const sendAll = button('link', () => void sendToAgent(list, true), icon('send'), 'Send all to agent');
            sendAll.setAttribute('aria-label', `Send all to agent: ${title}`);
            actions.append(sendAll);
        }
        if (fixActions) {
            const fixAll = button('link', () => fixActions.fix(list), icon('fix'), 'Fix all with Claude Code');
            fixAll.setAttribute('aria-label', `Fix all with Claude Code: ${title}`);
            actions.append(fixAll);
        }
        const copyAll = button('link', () => void copyPrompt(list), icon('copy'), 'Copy prompt for all');
        copyAll.setAttribute('aria-label', `Copy prompt for all: ${title}`);
        actions.append(copyAll);
        const card = el('div', { className: 'rule' }, head, actions);

        const all = expanded.has(ruleId);
        card.append(el('ul', {}, ...(all ? list : list.slice(0, FIRST_ISSUES)).map(issueItem)));
        updateAgentControls();
        if (!all && list.length > FIRST_ISSUES) {
            card.append(button('more', () => {
                expanded.add(ruleId);
                card.replaceWith(ruleCard(ruleId, list));
            }, `Show ${list.length - FIRST_ISSUES} more`));
        }
        return card;
    }

    function renderIssues() {
        const visible = issues.filter((issue) => shown.get(issue.severity) && shown.get(issue.category));
        overlay.show(visible);
        agentControls = new Map();

        const sections = CATEGORIES.flatMap(([category, label]) => {
            const byRule = new Map<string, Issue[]>();
            visible.filter((issue) => issue.category === category).forEach((issue) => {
                const list = byRule.get(issue.ruleId) ?? [];
                list.push(issue);
                byRule.set(issue.ruleId, list);
            });
            if (byRule.size === 0) return [];

            const count = Array.from(byRule.values()).reduce((sum, list) => sum + list.length, 0);
            const hasError = (list: Issue[]) => list.some((issue) => issue.severity === 'error');
            // Rules with errors first, then registry order (the sort is stable).
            const ordered = Array.from(byRule).sort(([, a], [, b]) => Number(hasError(b)) - Number(hasError(a)));
            const heading = el('p', { className: 'category', id: `sat-category-${category}` }, icon(category), `${label} · ${count}`);
            const section = el('div', {}, heading, ...ordered.map(([ruleId, list]) => ruleCard(ruleId, list)));
            section.setAttribute('role', 'group');
            section.setAttribute('aria-labelledby', heading.id);
            return [section];
        });

        issuesView.replaceChildren(...sections);
        if (visible.length === 0) {
            issuesView.append(el('p', { textContent: issues.length ? 'No issues match the filters.' : 'No issues found.' }));
        }
    }

    /** Nested lists, one level per heading level, in page order. */
    function renderOutline(outline: OutlineHeading[]) {
        structureCount.textContent = String(outline.length);
        if (outline.length === 0) {
            structureView.replaceChildren(el('p', { textContent: 'No headings found.' }));
            return;
        }

        const list = el('ul', { className: 'outline' });
        const open: Array<{ level: number; item: HTMLLIElement }> = [];
        outline.forEach(({ element, level, text, skipped }) => {
            while (open.length && open[open.length - 1].level >= level) open.pop();
            const parent = open[open.length - 1]?.item;
            const parentList = parent ? parent.querySelector(':scope > ul') ?? parent.appendChild(el('ul')) : list;

            const item = button('item', () => overlay.reveal(element), el('span', { className: 'level', textContent: `H${level}` }), text || '(empty)');
            if (skipped) item.append(' ', el('span', { className: 'skip', textContent: '— level skipped' }));

            const li = el('li', {}, item);
            parentList.append(li);
            open.push({ level, item: li });
        });
        structureView.replaceChildren(list);
    }

    root.addEventListener('keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Escape' && !panel.hidden) setPanelOpen(false, true);
    });

    showTab('issues');
    setSide(storedSide());

    return {
        host,

        setRunning(running) {
            runButton.replaceChildren(icon(running ? 'stop' : 'play'));
            runButton.setAttribute('aria-label', running ? 'Stop SAT and clear highlights' : 'Run SAT checks');
            rerunButton.hidden = !running;
            resultsButton.hidden = !running;
            resultsButton.textContent = 'Running…';
            if (!running) {
                issues = [];
                overlay.clear();
                setPanelOpen(false);
            }
        },

        showResults(newIssues, outline, duration) {
            issues = newIssues;
            const list = issueIds(issues);
            ids = new Map(issues.map((issue, index) => [issue, list[index]]));
            expanded.clear();
            const errors = issues.filter((issue) => issue.severity === 'error').length;
            const warnings = issues.length - errors;
            resultsButton.replaceChildren(icon('error'), plural(errors, 'error'), ' · ', icon('warning'), plural(warnings, 'warning'));
            time.textContent = duration === undefined ? '' : `checked in ${Math.round(duration)} ms`;
            issuesCount.textContent = String(issues.length);
            FILTERS.forEach(([filter]) => {
                const count = issues.filter((issue) => issue.severity === filter || issue.category === filter).length;
                counters.get(filter)!.querySelector('.count')!.textContent = String(count);
            });
            renderIssues();
            renderOutline(outline);
        },

        clearHighlights: () => overlay.clear(),
        showFix,
        showAgent,
    };
}
