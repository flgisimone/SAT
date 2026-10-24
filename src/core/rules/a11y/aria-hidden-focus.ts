import { describeElement, isInTabOrder, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/**
 * Nothing reachable with Tab inside aria-hidden="true" (ACT 6cfa84, WCAG 4.1.2): keyboard users
 * would land on content that screen readers don't announce. aria-hidden="false" on a descendant
 * doesn't undo it. tabindex="-1", disabled, inert and not rendered elements are fine.
 * Sentinels that move focus away with a script can't be told apart and are reported.
 */
export const ariaHiddenFocus: Rule = {
    id: 'aria-hidden-focus',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['4.1.2'],
    run({ document, report }) {
        const reported = new Set<Element>();
        queryTargets('[aria-hidden]', document).forEach((hidden) => {
            if (hidden.getAttribute('aria-hidden')!.trim().toLowerCase() !== 'true') return;

            [hidden, ...hidden.querySelectorAll('*')].forEach((el) => {
                if (reported.has(el) || !isInTabOrder(el)) return;
                reported.add(el);
                report({
                    element: el,
                    message: `${describeElement(el)} can receive keyboard focus but is inside aria-hidden="true", so screen readers don't announce it. Remove aria-hidden, or take it out of the tab order (tabindex="-1", disabled or inert).`,
                });
            });
        });
    },
};
