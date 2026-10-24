import { logError, logWarning } from "../../sat/satLogger";
import { describeElement, highlight, isElementVisible, queryTargets } from "../../sat/satDom";

const FOCUSABLE_SELECTOR = 'a[href], button, input, textarea, select, summary, [tabindex], [contenteditable="true"]';
const NATIVE_INTERACTIVE = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'SUMMARY'];

/**
 * Checks focus management on interactive elements:
 * - hidden or disabled elements that are still in the tab order;
 * - positive tabindex values, which override the natural tab order;
 * - non-interactive elements placed in the tab order without a role.
 *
 * tabindex="-1" on non-interactive elements is fine (programmatic focus) and is not reported here.
 */
export function checkFocusManagement(enableCheckFocusManagement?: boolean): void {
    if (!enableCheckFocusManagement) return;

    queryTargets<HTMLElement>(FOCUSABLE_SELECTOR).forEach((el) => {
        const tabIndexAttr = el.getAttribute('tabindex');
        const tabIndex = tabIndexAttr === null ? null : parseInt(tabIndexAttr, 10);
        const isDisabled = (el as HTMLInputElement).disabled === true;

        if (isDisabled || !isElementVisible(el)) {
            if (tabIndex !== null && tabIndex >= 0) {
                const msg = `${describeElement(el)} is hidden or disabled but has tabindex="${tabIndexAttr}". It should not be focusable.`;
                logError(msg);
                highlight(el, { outline: '2px dashed orange', title: msg });
            }
            return;
        }

        if (tabIndex !== null && tabIndex > 0) {
            const msg = `${describeElement(el)} has tabindex="${tabIndexAttr}". Positive tabindex values change the tab order and confuse keyboard users; use 0.`;
            logWarning(msg);
            highlight(el, { outline: '2px dashed blue', title: msg });
        }

        const isNativeInteractive = NATIVE_INTERACTIVE.includes(el.tagName) || el.isContentEditable;
        const hasRole = !!el.getAttribute('role')?.trim();

        if (!isNativeInteractive && !hasRole && tabIndex !== null && tabIndex >= 0) {
            const msg = `${describeElement(el)} is in the tab order (tabindex="${tabIndexAttr}") but is not interactive. Use a native control (e.g. <button>) or add a role.`;
            logWarning(msg);
            highlight(el, { outline: '2px dashed yellow', title: msg });
        }
    });
}
