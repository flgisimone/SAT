import type { OutlineHeading } from '../core/rules/headings';
import type { Category, Issue, Severity } from '../sat/issue';
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
export function createSATUI(onToggle: () => void, onRerun: () => void): SATUI {
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
        el('div', { className: 'header' }, el('span', { className: 'brand' }, icon('brand'), 'SAT', time), sideButton, closeButton),
        summary,
        el('div', { className: 'tabs' }, issuesTab, structureTab),
        issuesView,
        structureView,
    );
    panel.setAttribute('aria-label', 'SAT results');

    const dock = el('div', { className: 'dock' }, runButton, rerunButton, resultsButton);
    // A constructed sheet instead of <style>: a page's CSP `style-src` doesn't block it (e.g. under the browser extension).
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(STYLES);
    root.adoptedStyleSheets = [sheet];
    root.append(layer, dock, panel);

    let issues: Issue[] = [];
    let side: Side = 'left';
    const expanded = new Set<string>();

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
        return el('li', {}, content);
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
        const card = el('div', { className: 'rule' }, head);
        if (first.help) {
            const docs = el('a', { className: 'docs', href: first.help, target: '_blank', rel: 'noopener noreferrer' }, 'Why and how to fix', icon('external'));
            docs.setAttribute('aria-label', `Why and how to fix: ${title} (opens in a new tab)`);
            card.append(docs);
        }

        const all = expanded.has(ruleId);
        card.append(el('ul', {}, ...(all ? list : list.slice(0, FIRST_ISSUES)).map(issueItem)));
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
    };
}
