import { queryTargets } from "../../../sat/satDom";
import { LEVEL_STYLES } from "../headings";
import type { Rule } from "../rule";

/** The page has exactly one <h1>. */
export const h1: Rule = {
    id: 'h1',
    category: 'seo',
    defaultSeverity: 'error',
    run({ document, report, highlight }) {
        const h1s = queryTargets<HTMLElement>('h1', document);

        if (h1s.length === 0) {
            report({ message: 'No <h1> found on the page.' });
        } else if (h1s.length > 1) {
            report({ message: `Multiple <h1> found on the page (${h1s.length}). Use a single <h1> for the main topic.` });
            h1s.forEach((el) => highlight(el, { ...LEVEL_STYLES[1], title: '❌ Multiple <h1> on the page' }));
        }
    },
};
