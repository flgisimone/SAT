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

    const elements = document.querySelectorAll('[tabindex="-1"]');

    elements.forEach((el) => {
        const tag = el.tagName;
        const ariaHidden = el.getAttribute('aria-hidden');

        if (ariaHidden !== 'true') {
            console.error(
                `❌️ Accessibility warning: <${tag}> has tabindex="-1" but is still visible and lacks aria-hidden="true". ` +
                `Ensure this element doesn't block keyboard navigation or confuse screen reader users.`
            );
        }
    });
}
