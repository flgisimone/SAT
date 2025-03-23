/**
 * Checks for elements that have `tabindex="-1"` applied.
 *
 * ✅ Purpose:
 * - Ensures elements with `tabindex="-1"` are intentionally removed from keyboard navigation.
 * - Warns if an element is still visible and potentially interactive without `aria-hidden="true"`.
 *
 * ⚠️ Common issues:
 * - Elements incorrectly made unreachable by keyboard users.
 * - Missing `aria-hidden` on elements not meant for screen readers.
 *
 * Example use cases:
 * - Modals, dialogs, skip links, or custom interactive components.
 *
 * @function checkTabindexNegativeOne
 * @returns {void}
 */
export function checkTabindexNegativeOne(enableCheckTabindexNegativeOne?: boolean): void {
    if (!enableCheckTabindexNegativeOne) return;

    const elements = document.querySelectorAll<HTMLElement>('[tabindex="-1"]');
    let totalIssues = 0;

    elements.forEach((el, index) => {
        const tag = el.tagName.toLowerCase();
        const ariaHidden = el.getAttribute('aria-hidden');

        if (ariaHidden !== 'true') {
            totalIssues++;

            console.error(
                `❌ [${index + 1}] <${tag}> has tabindex="-1" but lacks aria-hidden="true".` +
                ` This element is visible and might be confusing for screen reader users.`
            );

            el.title = '⚠️ tabindex="-1" without aria-hidden="true"';
        }
    });

    if (totalIssues === 0) {
        console.log('✅ No tabindex="-1" issues found. All elements are properly labeled or hidden.');
    } else {
        console.warn(`⚠️ Found ${totalIssues} element(s) with tabindex="-1" missing aria-hidden="true". Review warnings above.`);
    }
}
