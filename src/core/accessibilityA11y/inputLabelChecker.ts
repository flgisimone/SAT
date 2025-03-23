/**
 * Checks all input fields for associated labels.
 * Logs warnings if an input is missing an accessible label.
 *
 * @returns {void}
 */
export function checkInputLabels(enableCheckInputLabel?: boolean): void {
    if (!enableCheckInputLabel) return;

    const inputs = Array.from(document.querySelectorAll('input, textarea, select')) as HTMLElement[];

    inputs.forEach((el) => {
        const hasId = el.hasAttribute('id');
        const id = el.getAttribute('id');
        const hasAriaLabel = el.hasAttribute('aria-label');
        const hasAriaLabelledBy = el.hasAttribute('aria-labelledby');

        // Check if there's a label with "for" that matches the id
        const labelFor = hasId ? document.querySelector(`label[for="${id}"]`) : null;

        // Check if the element is wrapped by a label (implicit association)
        const isWrappedInLabel = el.closest('label');

        const text = el.getAttribute('name') || el.getAttribute('placeholder') || el.getAttribute('id') || 'Unknown input';

        if (!labelFor && !isWrappedInLabel && !hasAriaLabel && !hasAriaLabelledBy) {
            console.error(`❌ Missing accessible label for input: ${text}`);

            // Optional: highlight the element visually
            el.style.outline = '2px dashed green';
            el.title = 'This input field is missing an accessible label';
        }
    });
}
