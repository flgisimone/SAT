import { describeElement, queryTargets } from "../../../sat/satDom";
import { HEADINGS, LEVEL_STYLES, headingLevel } from "../headings";
import type { Rule } from "../rule";

/**
 * Highlights every heading with a color per level (a visual outline of the page)
 * and checks that the first heading of the page is an <h1>.
 *
 * Going back to a higher level (e.g. H3 → H2) is valid: it starts a new section.
 * Skipped levels are reported by `heading-levels`.
 */
export const headingOrder: Rule = {
    id: 'heading-order',
    category: 'a11y',
    defaultSeverity: 'warning',
    wcag: ['1.3.1'],
    run({ document, report, highlight }) {
        const headings = queryTargets<HTMLElement>(HEADINGS, document);
        headings.forEach((el) => highlight(el, LEVEL_STYLES[headingLevel(el)]));

        const first = headings[0];
        if (first && headingLevel(first) !== 1) {
            const message = `The first heading of the page is ${describeElement(first)}, not an <h1>.`;
            report({ element: first, message, highlight: { title: message } });
        }
    },
};
