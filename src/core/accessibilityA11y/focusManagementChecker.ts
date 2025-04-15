import {logError, logWarning} from "../../sat/satLogger";

/**
 * Checks focus management on interactive elements:
 * - Ensures focusable elements are reachable via keyboard.
 * - Warns about improper use of tabindex.
 * - Highlights potential focus issues.
 */
export function checkFocusManagement(enableCheckFocusManagement?: boolean): void {
    if (!enableCheckFocusManagement) return;

    const focusableSelectors = [
        'a[href]', 'button', 'input', 'textarea', 'select',
        '[tabindex]', '[contenteditable="true"]'
    ];

    const elements = Array.from(document.querySelectorAll<HTMLElement>(focusableSelectors.join(',')));

    elements.forEach((el) => {
        const computedStyle = window.getComputedStyle(el);
        const isVisible = computedStyle.display !== 'none' &&
            computedStyle.visibility !== 'hidden' &&
            el.offsetParent !== null;

        const isDisabled = (el as HTMLInputElement).disabled;
        const tabIndex = el.getAttribute('tabindex');
        const role = el.getAttribute('role') || '';
        const tag = el.tagName;
        const text = el.textContent?.trim() || '[no text]';

        // ❌ 1. Focusable but hidden or disabled
        if (!isVisible || isDisabled) {
            if (tabIndex !== null && parseInt(tabIndex) >= 0) {
                const msg = `${tag} "${text}" is hidden or disabled but has tabindex="${tabIndex}". It should not be focusable.`;
                logError(msg);

                el.style.outline = '2px dashed orange';
                el.title = msg;
            }
            return;
        }

        // ⚠️ 2. Tabindex > 0
        if (tabIndex !== null && parseInt(tabIndex) > 0) {
            const msg = `${tag} "${text}" has tabindex="${tabIndex}". Manual tab order can confuse keyboard users.`;
            logWarning(msg);

            el.style.outline = '2px dashed blue';
            el.title = msg;
        }

        // ⚠️ 3. Non-interactive element with tabindex but no role/onClick
        const isSemanticallyInteractive = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
        const isExplicitlyInteractive = role !== '' || el.hasAttribute('onclick');

        if (!isSemanticallyInteractive && !isExplicitlyInteractive && tabIndex !== null) {
            const msg = `${tag} "${text}" has tabindex="${tabIndex}" but is not a semantic or interactive element. Consider removing tabindex or adding a role.`;
            logWarning(msg);

            el.style.outline = '2px dashed yellow';
            el.title = msg;
        }
    });
}
