import { describeElement } from "../../../sat/satDom";
import { headingOutline } from "../headings";
import type { Rule } from "../rule";

/**
 * Skipped heading levels going down the outline (e.g. H2 → H4). A warning: WCAG lists ordered
 * levels as an advisory technique (G141), not as a requirement of 1.3.1.
 */
export const headingLevels: Rule = {
    id: 'heading-levels',
    title: 'Heading levels are not skipped',
    category: 'a11y',
    defaultSeverity: 'warning',
    wcag: ['1.3.1'],
    run({ document, report }) {
        headingOutline(document).forEach(({ element, skipped }, i, outline) => {
            if (!skipped) return;
            const previous = outline[i - 1].level;
            report({ element, message: `Heading level skipped: ${describeElement(element)} comes after an H${previous}. Expected H${previous + 1} or higher.` });
        });
    },
};
