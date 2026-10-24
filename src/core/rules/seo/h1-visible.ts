import { describeElement, isElementVisible, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/** The first <h1> is rendered (not display:none, hidden or transparent). A missing <h1> is reported by `h1`. */
export const h1Visible: Rule = {
    id: 'h1-visible',
    title: 'Main heading is visible',
    source: 'Google',
    category: 'seo',
    defaultSeverity: 'warning',
    run({ document, report }) {
        const el = queryTargets<HTMLElement>('h1', document)[0];

        if (el && !isElementVisible(el)) {
            report({
                element: el,
                message: `The first <h1> is not visible: ${describeElement(el)}. The main heading should be rendered on the page.`,
            });
        }
    },
};
