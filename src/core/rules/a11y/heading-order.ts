import { describeElement, queryTargets } from "../../../sat/satDom";
import { HEADINGS, headingLevel } from "../headings";
import type { Rule } from "../rule";

/**
 * The first heading of the page is an <h1>.
 * The panel's Structure tab shows the whole outline.
 *
 * Going back to a higher level (e.g. H3 → H2) is valid: it starts a new section.
 * Skipped levels are reported by `heading-levels`.
 */
export const headingOrder: Rule = {
    id: 'heading-order',
    title: 'Headings follow the outline',
    category: 'a11y',
    defaultSeverity: 'warning',
    wcag: ['1.3.1'],
    run({ document, report }) {
        const first = queryTargets<HTMLElement>(HEADINGS, document)[0];
        if (first && headingLevel(first) !== 1) {
            const message = `The first heading of the page is ${describeElement(first)}, not an <h1>.`;
            report({ element: first, message });
        }
    },
};
