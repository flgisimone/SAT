/**
 * Checks focus management on interactive elements:
 * - Ensures focusable elements are reachable via keyboard.
 * - Warns about improper use of tabindex.
 * - Highlights potential focus issues.
 */
export function checkFocusManagement(): void {
    const focusableSelectors = [
        'a[href]', 'button', 'input', 'textarea', 'select',
        '[tabindex]', '[contenteditable="true"]'
    ];

    const elements = Array.from(document.querySelectorAll<HTMLElement>(focusableSelectors.join(',')));

    elements.forEach((el) => {
        const computedStyle = window.getComputedStyle(el);
        const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden' && el.offsetParent !== null;
        const isDisabled = (el as HTMLInputElement).disabled;

        const tabIndex = el.getAttribute('tabindex');
        const role = el.getAttribute('role') || '';

        // 1. Should not be focusable if hidden or disabled
        if (!isVisible || isDisabled) {
            if (tabIndex !== null && parseInt(tabIndex) >= 0) {
                console.info(`❌ ${el.tagName} element should not be focusable because it's hidden or disabled.`);
                el.style.outline = '2px dashed orange';
            }

            return;
        }

        // 2. Warn if tabindex is > 0 (manual tab order can break accessibility)
        if (tabIndex !== null && parseInt(tabIndex) > 0) {
            console.warn(`⚠️ ${el.tagName} has tabindex="${tabIndex}". Manual tab order can be confusing for keyboard users.`);

            el.style.outline = '2px dashed blue';
        }

        // 3. Non-interactive elements with tabindex but no role or interactivity
        const isSemanticallyInteractive = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
        const isExplicitlyInteractive = role !== '' || el.hasAttribute('onclick');

        if (!isSemanticallyInteractive && !isExplicitlyInteractive && tabIndex !== null) {
            console.info(`❌ ${el.tagName} has tabindex but is not a semantic or role-based interactive element. Consider adding role or removing tabindex.`);

            el.style.outline = '2px dashed yellow';
        }
    });
}
