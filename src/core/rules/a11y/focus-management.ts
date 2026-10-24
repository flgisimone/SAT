import { describeElement, isElementVisible, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

const FOCUSABLE_SELECTOR = 'a[href], button, input, textarea, select, summary, [tabindex], [contenteditable="true"]';
const NATIVE_INTERACTIVE = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'SUMMARY'];

/**
 * Focus management on interactive elements (WCAG 2.4.3):
 * - error: hidden or disabled elements that are still in the tab order;
 * - warning: positive tabindex values, which override the natural tab order;
 * - warning: non-interactive elements placed in the tab order without a role.
 *
 * tabindex="-1" on non-interactive elements is fine (programmatic focus) and is not reported here.
 */
export const focusManagement: Rule = {
    id: 'focus-management',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['2.4.3'],
    run({ document, report }) {

        queryTargets<HTMLElement>(FOCUSABLE_SELECTOR, document).forEach((el) => {
            const tabIndexAttr = el.getAttribute('tabindex') ?? '';
            const tabIndex = parseInt(tabIndexAttr, 10); // NaN without the attribute
            const isDisabled = (el as HTMLInputElement).disabled === true;
            const desc = describeElement(el);

            if (isDisabled || !isElementVisible(el)) {
                if (tabIndex >= 0) {
                    const message = `${desc} is hidden or disabled but has tabindex="${tabIndexAttr}". It should not be focusable.`;
                    report({ element: el, message, highlight: { outline: '2px dashed orange', title: message } });
                }
                return;
            }

            if (tabIndex > 0) {
                const message = `${desc} has tabindex="${tabIndexAttr}". Positive tabindex values change the tab order and confuse keyboard users; use 0.`;
                report({ element: el, message, severity: 'warning', highlight: { outline: '2px dashed blue', title: message } });
            }

            const isNativeInteractive = NATIVE_INTERACTIVE.includes(el.tagName) || el.isContentEditable;
            const hasRole = !!el.getAttribute('role')?.trim();

            if (!isNativeInteractive && !hasRole && tabIndex >= 0) {
                const message = `${desc} is in the tab order (tabindex="${tabIndexAttr}") but is not interactive. Use a native control (e.g. <button>) or add a role.`;
                report({ element: el, message, severity: 'warning', highlight: { outline: '2px dashed yellow', title: message } });
            }
        });
    },
};
