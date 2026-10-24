export type Severity = 'error' | 'warning';
export type Category = 'a11y' | 'seo';

/** One problem found on the page. */
export interface Issue {
    ruleId: string;
    severity: Severity;
    category: Category;
    message: string;
    /** Readable name of the rule, e.g. "Images have alternative text". */
    title?: string;
    /** WCAG success criteria the rule enforces, e.g. ["1.1.1"]. */
    wcag?: string[];
    /** Source of rules without a WCAG criterion, e.g. "Google". */
    source?: string;
    element?: Element;
    /** CSS selector that matches `element` and nothing else. */
    selector?: string;
    /** Page that explains the rule and how to fix the issue (absent only when the whole run fails). */
    help?: string;
}

const RULE_DOCS = 'https://github.com/flgisimone/SAT/blob/develop/docs/rules/';

/** Documentation page of a rule. */
export function ruleHelp(ruleId: string): string {
    return `${RULE_DOCS}${ruleId}.md`;
}

function idSelector(id: string): string {
    return `[id="${id.replace(/["\\]/g, '\\$&')}"]`;
}

// Sibling walks instead of copying `parent.children`: a list of 1,000 items reported
// item by item would otherwise cost a copy of the list per item.
function indexOfType(el: Element): number {
    let index = 1;
    for (let sibling = el.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
        if (sibling.localName === el.localName) index++;
    }
    return index;
}

function hasSiblingOfType(el: Element): boolean {
    for (const step of ['previousElementSibling', 'nextElementSibling'] as const) {
        for (let sibling = el[step]; sibling; sibling = sibling[step]) {
            if (sibling.localName === el.localName) return true;
        }
    }
    return false;
}

/**
 * Builds a CSS selector that matches only `el`: the closest ancestor with a unique id,
 * then `tag:nth-of-type(n)` steps down to the element.
 */
export function cssSelector(el: Element): string {
    const doc = el.ownerDocument;
    const parts: string[] = [];

    for (let node: Element | null = el; node; node = node.parentElement) {
        if (node.id && doc.querySelectorAll(idSelector(node.id)).length === 1) {
            parts.unshift(idSelector(node.id));
            break;
        }

        const tag = node.localName;
        const parent: Element | null = node.parentElement;
        if (!parent) {
            parts.unshift(tag);
            break;
        }

        parts.unshift(hasSiblingOfType(node) ? `${tag}:nth-of-type(${indexOfType(node)})` : tag);
    }

    return parts.join(' > ');
}
