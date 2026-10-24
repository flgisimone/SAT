import { describeElement } from "../../../sat/satDom";
import { headingOutline } from "../headings";
import type { Rule } from "../rule";

/** Reports skipped heading levels going down the outline (e.g. H2 → H4). */
export const headingLevels: Rule = {
    id: 'heading-levels',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['1.3.1'],
    run({ document, report }) {
        headingOutline(document).forEach(({ element, skipped }, i, outline) => {
            if (!skipped) return;
            const previous = outline[i - 1].level;
            report({ element, message: `Heading level skipped: ${describeElement(element)} comes after an H${previous}. Expected H${previous + 1} or higher.` });
        });
    },
};
