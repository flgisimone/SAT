import { queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/**
 * The page has an <h1> (warning). Several <h1> are valid HTML and Google sets no number of headings,
 * so they are not reported.
 */
export const h1: Rule = {
    id: 'h1',
    title: 'Page has a main heading',
    source: 'Google',
    category: 'seo',
    defaultSeverity: 'warning',
    run({ document, report }) {
        if (queryTargets('h1', document).length === 0) {
            report({ message: 'No <h1> found on the page. Give the page a main heading that names its topic.' });
        }
    },
};
