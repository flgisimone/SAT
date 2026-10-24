import type { OutlineHeading } from '../core/rules/headings';
import type { Category, Issue, Severity } from '../sat/issue';
import { createOverlay } from './overlay';
import { STYLES } from './styles';

export interface SATUI {
    /** Goes in the page; everything else is in its shadow root. */
    host: HTMLElement;
    setRunning(running: boolean): void;
    showResults(issues: Issue[], outline: OutlineHeading[]): void;
    clearHighlights(): void;
}

type Filter = Severity | Category;

const FILTERS: Array<[Filter, string]> = [
    ['error', 'Errors'],
    ['warning', 'Warnings'],
    ['a11y', 'Accessibility'],
    ['seo', 'SEO'],
];

function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props: Partial<HTMLElementTagNameMap[K]> = {},
    ...children: Array<Node | string>
): HTMLElementTagNameMap[K] {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
}

function button(className: string, text: string, onClick: () => void): HTMLButtonElement {
    const node = el('button', { type: 'button', className, textContent: text });
    node.addEventListener('click', onClick);
    return node;
}

function plural(count: number, word: string): string {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/**
 * The in-page UI: a dock (run/stop, run again, results) and a results panel with
 * the issues grouped by rule and the heading structure. Built in a shadow root.
 */
export function createSATUI(onToggle: () => void, onRerun: () => void): SATUI {
    const host = document.createElement('sat-panel');
    host.setAttribute('data-sat-ignore', '');
    const root = host.attachShadow({ mode: 'open' });

    const layer = el('div', { className: 'layer' });
    layer.setAttribute('aria-hidden', 'true');
    const overlay = createOverlay(layer);

    const runButton = button('round', '', onToggle);
    runButton.id = 'sat-run-button';
    const rerunButton = button('round', '🔃', onRerun);
    rerunButton.setAttribute('aria-label', 'Run SAT checks again');
    const resultsButton = button('results', '', () => setPanelOpen(panel.hidden === true));
    resultsButton.setAttribute('aria-controls', 'sat-results');

    const issuesTab = button('tab', '', () => showTab('issues'));
    const structureTab = button('tab', '', () => showTab('structure'));
    const closeButton = button('close', '✕', () => setPanelOpen(false, true));
    closeButton.setAttribute('aria-label', 'Close SAT results');

    const checkboxes = new Map<Filter, HTMLInputElement>();
    const filterLabels = new Map<Filter, HTMLSpanElement>();
    const filters = el('fieldset', { className: 'filters' }, el('legend', { textContent: 'Show' }), el('div', {}, ...FILTERS.map(([filter]) => {
        const checkbox = el('input', { type: 'checkbox', checked: true });
        checkbox.addEventListener('change', renderIssues);
        checkboxes.set(filter, checkbox);
        const text = el('span');
        filterLabels.set(filter, text);
        return el('label', {}, checkbox, text);
    })));
    const groups = el('div');
    const issuesView = el('div', { className: 'view' }, filters, groups);
    const structureView = el('div', { className: 'view', hidden: true });

    const panel = el('section', { id: 'sat-results', className: 'panel', hidden: true },
        el('div', { className: 'header' }, el('span', { className: 'title', textContent: 'SAT' }), issuesTab, structureTab, closeButton),
        issuesView,
        structureView,
    );
    panel.setAttribute('aria-label', 'SAT results');

    const dock = el('div', { className: 'dock' }, runButton, rerunButton, resultsButton);
    root.append(el('style', { textContent: STYLES }), layer, dock, panel);

    let issues: Issue[] = [];
    const openGroups = new Set<string>();

    function setPanelOpen(open: boolean, returnFocus = false) {
        panel.hidden = !open;
        resultsButton.setAttribute('aria-expanded', String(open));
        if (returnFocus) resultsButton.focus();
    }

    function showTab(tab: 'issues' | 'structure') {
        issuesView.hidden = tab !== 'issues';
        structureView.hidden = tab !== 'structure';
        issuesTab.setAttribute('aria-pressed', String(tab === 'issues'));
        structureTab.setAttribute('aria-pressed', String(tab === 'structure'));
    }

    function issueItem(issue: Issue): HTMLLIElement {
        const badge = el('span', { className: 'badge', textContent: issue.severity === 'error' ? 'Error' : 'Warning' });
        const element = issue.element;
        const content = element
            ? button('item', '', () => overlay.reveal(element))
            : el('span');
        content.append(badge, issue.message);
        return el('li', { className: issue.severity }, content);
    }

    function renderIssues() {
        const visible = issues.filter((issue) => checkboxes.get(issue.severity)!.checked && checkboxes.get(issue.category)!.checked);
        overlay.show(visible);

        const byRule = new Map<string, Issue[]>();
        visible.forEach((issue) => {
            const list = byRule.get(issue.ruleId) ?? [];
            list.push(issue);
            byRule.set(issue.ruleId, list);
        });

        groups.replaceChildren(...Array.from(byRule, ([ruleId, list]) => {
            const details = el('details', { open: openGroups.has(ruleId) },
                el('summary', { textContent: `${ruleId} (${list.length})` }),
            );
            const help = list[0].help;
            if (help) details.append(el('a', { className: 'docs', href: help, target: '_blank', rel: 'noopener noreferrer', textContent: `How to fix ${ruleId}` }));
            details.append(el('ul', {}, ...list.map(issueItem)));
            details.addEventListener('toggle', () => (details.open ? openGroups.add(ruleId) : openGroups.delete(ruleId)));
            return details;
        }));
        if (visible.length === 0) {
            groups.append(el('p', { textContent: issues.length ? 'No issues match the filters.' : 'No issues found.' }));
        }
    }

    /** Nested lists, one level per heading level, in page order. */
    function renderOutline(outline: OutlineHeading[]) {
        structureTab.textContent = `Structure (${outline.length})`;
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

            const item = button('item', '', () => overlay.reveal(element));
            item.append(el('span', { className: 'level', textContent: `H${level}` }), text || '(empty)');
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

    return {
        host,

        setRunning(running) {
            runButton.textContent = running ? '🛑' : '🚀';
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

        showResults(newIssues, outline) {
            issues = newIssues;
            const errors = issues.filter((issue) => issue.severity === 'error').length;
            const warnings = issues.length - errors;
            resultsButton.textContent = `${plural(errors, 'error')} · ${plural(warnings, 'warning')}`;
            issuesTab.textContent = `Issues (${issues.length})`;
            FILTERS.forEach(([filter, label]) => {
                const count = issues.filter((issue) => issue.severity === filter || issue.category === filter).length;
                filterLabels.get(filter)!.textContent = `${label} (${count})`;
            });
            renderIssues();
            renderOutline(outline);
        },

        clearHighlights: () => overlay.clear(),
    };
}
