import { describeElement, isAriaHidden, isElementVisible, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

const NATIVE_CONTROLS = 'a[href], button, input:not([type="hidden"]), select, textarea, summary';

/**
 * Visible native controls taken out of the tab order with tabindex="-1" (WCAG 2.1.1).
 * Such controls can be clicked with a mouse but not reached with the keyboard.
 *
 * tabindex="-1" on non-interactive elements (modals, skip-link targets, headings
 * focused by code) is the correct pattern and is not reported.
 */
export const tabindexNegative: Rule = {
    id: 'tabindex-negative',
    category: 'a11y',
    defaultSeverity: 'warning',
    wcag: ['2.1.1'],
    run({ document, report }) {

        queryTargets<HTMLElement>('[tabindex="-1"]', document).forEach((el) => {
            if (!el.matches(NATIVE_CONTROLS)) return;
            if ((el as HTMLButtonElement).disabled || isAriaHidden(el) || !isElementVisible(el)) return;

            report({
                element: el,
                message: `${describeElement(el)} is visible and interactive but has tabindex="-1", so keyboard users can't reach it.`,
            });
        });
    },
};
