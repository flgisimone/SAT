import { logError } from '../../sat/satLogger';

/**
 * Checks all input fields for associated labels.
 * Logs errors if an input is missing an accessible label.
 */
export function checkInputLabels(enableCheckInputLabel?: boolean): void {
    if (!enableCheckInputLabel) return;

    const inputs = Array.from(document.querySelectorAll('input, textarea, select')) as HTMLElement[];

    inputs.forEach((el) => {
        const hasId = el.hasAttribute('id');
        const id = el.getAttribute('id');
        const hasAriaLabel = el.hasAttribute('aria-label');
        const hasAriaLabelledBy = el.hasAttribute('aria-labelledby');

        const labelFor = hasId ? document.querySelector(`label[for="${id}"]`) : null;
        const isWrappedInLabel = el.closest('label');

        const name = el.getAttribute('name') || 'Unnamed';
        const placeholder = el.getAttribute('placeholder') || '';
        const fieldId = el.getAttribute('id') || 'No ID';

        const fieldInfo = `name="${name}", id="${fieldId}", placeholder="${placeholder}"`;

        if (!labelFor && !isWrappedInLabel && !hasAriaLabel && !hasAriaLabelledBy) {
            const msg = `Missing accessible label for input field (${el.tagName}): ${fieldInfo}`;
            logError(msg);

            el.style.outline = '2px dashed green';
            el.title = '❌ Missing accessible label';
        }
    });
}
