import { computedStyle, describeElement, isElementVisible, isRendered, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

const FOCUSABLE_SELECTOR = 'a[href], button, input, textarea, select, summary, [tabindex], [contenteditable="true"]';
const NATIVE_INTERACTIVE = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'SUMMARY'];

/** Scrolls its content (overflow auto or scroll): tabindex="0" lets keyboard users scroll it (WCAG 2.1.1). */
function isScrollContainer(el: Element): boolean {
    const { overflowX, overflowY } = computedStyle(el);
    return /auto|scroll/.test(`${overflowX} ${overflowY}`);
}

/**
 * Focus management on interactive elements (WCAG 2.4.3), all warnings:
 * - transparent or boxless elements placed in the tab order with tabindex: the focus lands on
 *   something nobody sees. Focus guards that move the focus on with a script look the same;
 * - positive tabindex values, which override the natural tab order;
 * - non-interactive elements placed in the tab order without a role (scroll containers excepted).
 *
 * Elements that are not rendered (display: none, hidden, visibility: hidden), disabled or inert
 * can't take focus, whatever their tabindex, and are not reported. tabindex="-1" on
 * non-interactive elements is fine (programmatic focus).
 */
export const focusManagement: Rule = {
    id: 'focus-management',
    title: 'Tab order skips hidden elements',
    category: 'a11y',
    defaultSeverity: 'warning',
    wcag: ['2.4.3'],
    run({ document, report }) {

        queryTargets<HTMLElement>(FOCUSABLE_SELECTOR, document).forEach((el) => {
            if ((el as HTMLInputElement).disabled === true || el.closest('[inert]') || !isRendered(el)) return;
            const tabIndexAttr = el.getAttribute('tabindex') ?? '';
            const tabIndex = parseInt(tabIndexAttr, 10); // NaN without the attribute
            const desc = describeElement(el);

            if (!isElementVisible(el)) {
                if (tabIndex >= 0) {
                    report({ element: el, message: `${desc} is invisible but in the tab order (tabindex="${tabIndexAttr}"): keyboard users lose the focus on it. Use tabindex="-1", or show it when it has focus.` });
                }
                return;
            }

            if (tabIndex > 0) {
                report({ element: el, message: `${desc} has tabindex="${tabIndexAttr}". Positive tabindex values change the tab order and confuse keyboard users; use 0.` });
            }

            const isNativeInteractive = NATIVE_INTERACTIVE.includes(el.tagName) || el.isContentEditable;
            const hasRole = !!el.getAttribute('role')?.trim();

            if (!isNativeInteractive && !hasRole && tabIndex >= 0 && !isScrollContainer(el)) {
                report({ element: el, message: `${desc} is in the tab order (tabindex="${tabIndexAttr}") but is not interactive. Use a native control (e.g. <button>) or add a role.` });
            }
        });
    },
};
