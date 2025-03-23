/**
 * Checks all input fields for associated labels.
 * Logs warnings if an input is missing an accessible label.
 *
 * @param enableCheckInputLabel - Enables or disables this check.
 * @returns {void}
 */
export function checkInputLabels(enableCheckInputLabel?: boolean): void {
    if (!enableCheckInputLabel) return;

    const inputs = Array.from(document.querySelectorAll('input, textarea, select')) as HTMLElement[];

    let missingLabelsCount = 0;

    inputs.forEach((el, index) => {
        const hasId = el.hasAttribute('id');
        const id = el.getAttribute('id');
        const hasAriaLabel = el.hasAttribute('aria-label');
        const hasAriaLabelledBy = el.hasAttribute('aria-labelledby');

        // Explicit label with "for"
        const labelFor = hasId ? document.querySelector(`label[for="${id}"]`) : null;

        // Implicit label by wrapping
        const isWrappedInLabel = el.closest('label');

        const text = el.getAttribute('name') ||
            el.getAttribute('placeholder') ||
            el.getAttribute('id') ||
            `Input #${index + 1}`;

        // Condition: Missing any form of label association
        if (!labelFor && !isWrappedInLabel && !hasAriaLabel && !hasAriaLabelledBy) {
            console.error(`❌ Missing accessible label for <${el.tagName.toLowerCase()}>: "${text}"`, el);

            el.title = '❌ Missing accessible label';

            missingLabelsCount++;
        }
    });

    if (missingLabelsCount === 0) {
        console.log('🎉✅ All input, textarea, and select fields have accessible labels!');
    } else {
        console.warn(`⚠️ ${missingLabelsCount} input fields are missing accessible labels!`);
    }
}
