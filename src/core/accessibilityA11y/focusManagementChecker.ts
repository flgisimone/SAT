/**
 * Checks focus management on interactive elements:
 * - Ensures focusable elements are reachable via keyboard.
 * - Warns about improper use of tabindex.
 * - Highlights potential focus issues.
 *
 * @param enableCheckFocusManagement - Enables or disables the focus management checker.
 * @returns {void}
 */
export function checkFocusManagement(enableCheckFocusManagement?: boolean): void {
    if (!enableCheckFocusManagement) return;

    const focusableSelectors = [
        'a[href]', 'button', 'input', 'textarea', 'select',
        '[tabindex]', '[contenteditable="true"]'
    ];

    const elements = Array.from(document.querySelectorAll<HTMLElement>(focusableSelectors.join(',')));

    let focusIssuesCount = 0;
    let tabindexWarningsCount = 0;

    elements.forEach((el, index) => {
        const computedStyle = window.getComputedStyle(el);
        const isVisible = computedStyle.display !== 'none' &&
            computedStyle.visibility !== 'hidden' &&
            el.offsetParent !== null;

        const isDisabled = (el as HTMLInputElement).disabled;
        const tabIndex = el.getAttribute('tabindex');
        const role = el.getAttribute('role') || '';

        const elInfo = `[${index + 1}] <${el.tagName.toLowerCase()}> ID: ${el.id || 'none'} CLASS: ${el.className || 'none'}`;

        // 1. Should not be focusable if hidden or disabled
        if (!isVisible || isDisabled) {
            if (tabIndex !== null && parseInt(tabIndex) >= 0) {
                console.error(`❌ ${elInfo} should NOT be focusable because it's hidden or disabled.`);

                focusIssuesCount++;
            }

            return;
        }

        if (tabIndex !== null && parseInt(tabIndex) > 0) {
            console.warn(`⚠️ ${elInfo} has tabindex="${tabIndex}". Manual tab order can confuse keyboard users.`);

            tabindexWarningsCount++;
        }

        // 3. Non-interactive elements with tabindex but no role or interactivity
        const isSemanticallyInteractive = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
        const isExplicitlyInteractive = role !== '' || el.hasAttribute('onclick');

        if (!isSemanticallyInteractive && !isExplicitlyInteractive && tabIndex !== null) {
            console.warn(`⚠️ ${elInfo} has tabindex but isn't a semantic or role-based interactive element. Consider adding a role or removing tabindex.`);

            tabindexWarningsCount++;
        }
    });

    if (focusIssuesCount === 0 && tabindexWarningsCount === 0) {
        console.log('🎉✅ All focusable elements have correct focus management!');
    } else {
        console.warn(`⚠️ Focus Management Summary: ${focusIssuesCount} focus issues and ${tabindexWarningsCount} tabindex warnings found.`);
    }
}
