import {logWarning} from "../../sat/satLogger";
/**
 * Checks for elements that have `tabindex="-1"` applied.
 *
 * ✅ Purpose:
 * - Ensures elements with `tabindex="-1"` are intentionally removed from keyboard navigation.
 * - Warns if an element is still visible and potentially interactive without `aria-hidden="true"`.
 */
export function checkTabindexNegativeOne(enableCheckTabindexNegativeOne?: boolean): void {
    if (!enableCheckTabindexNegativeOne) return;

    const elements = document.querySelectorAll('[tabindex="-1"]');

    elements.forEach((el) => {
        const tag = el.tagName;
        const ariaHidden = el.getAttribute('aria-hidden');

        if (ariaHidden !== 'true') {
            const msg = `Accessibility warning: <${tag}> has tabindex="-1" but is still visible and lacks aria-hidden="true". ` +
                `Ensure this element doesn't block keyboard navigation or confuse screen reader users.`;

            logWarning(msg);

            const element = el as HTMLElement;
            element.style.outline = '2px dashed #FFA500'; // orange warning
            element.title = '⚠️ tabindex="-1" without aria-hidden';
        }
    });
}
