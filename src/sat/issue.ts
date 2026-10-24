export type Severity = 'error' | 'warning';
export type Category = 'a11y' | 'seo';

/** One problem found on the page. */
export interface Issue {
    ruleId: string;
    severity: Severity;
    category: Category;
    message: string;
    /** WCAG success criteria the rule enforces, e.g. ["1.1.1"]. */
    wcag?: string[];
    element?: Element;
    /** CSS selector that matches `element` and nothing else. */
    selector?: string;
}

function idSelector(id: string): string {
    return `[id="${id.replace(/["\\]/g, '\\$&')}"]`;
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

        const sameTag = Array.from(parent.children).filter((child) => child.localName === tag);
        parts.unshift(sameTag.length > 1 ? `${tag}:nth-of-type(${sameTag.indexOf(node) + 1})` : tag);
    }

    return parts.join(' > ');
}
