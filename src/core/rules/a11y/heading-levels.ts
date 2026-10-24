import { describeElement, queryTargets } from "../../../sat/satDom";
import { HEADINGS, headingLevel } from "../headings";
import type { Rule } from "../rule";

/** Reports skipped heading levels going down the outline (e.g. H2 → H4). */
export const headingLevels: Rule = {
    id: 'heading-levels',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['1.3.1'],
    run({ document, report }) {
        let lastLevel = 0;

        queryTargets<HTMLElement>(HEADINGS, document).forEach((el) => {
            const level = headingLevel(el);

            if (lastLevel !== 0 && level - lastLevel > 1) {
                const message = `Heading level skipped: ${describeElement(el)} comes after an H${lastLevel}. Expected H${lastLevel + 1} or higher.`;
                report({ element: el, message, highlight: { title: message } });
            }

            lastLevel = level;
        });
    },
};
