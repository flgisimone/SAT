import { logError } from '../../sat/satLogger';
import { describeElement, highlight, queryTargets } from '../../sat/satDom';

const FIELD_SELECTOR =
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), textarea, select';

type FormField = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function fieldHasLabel(field: FormField): boolean {
    const labels = field.labels ? Array.from(field.labels) : [];
    return (
        labels.some((label) => (label.textContent || '').trim().length > 0) ||
        !!field.getAttribute('aria-label')?.trim() ||
        field.hasAttribute('aria-labelledby') ||
        !!field.getAttribute('title')?.trim()
    );
}

/**
 * Checks that form fields have an accessible label
 * (<label for>, wrapping <label>, aria-label, aria-labelledby or title).
 * A placeholder alone is not a label. Image buttons need an alt text.
 */
export function checkInputLabels(enableCheckInputLabel?: boolean): void {
    if (!enableCheckInputLabel) return;

    queryTargets<FormField>(FIELD_SELECTOR).forEach((field) => {
        if (fieldHasLabel(field)) return;

        const name = field.getAttribute('name') || 'unnamed';
        const placeholderNote = field.getAttribute('placeholder')
            ? ' A placeholder is not a replacement for a label.'
            : '';

        logError(`Missing label for form field ${describeElement(field)} (name="${name}").${placeholderNote}`);
        highlight(field, { outline: '2px dashed green', title: '❌ Missing accessible label' });
    });

    queryTargets<HTMLInputElement>('input[type="image"]').forEach((input) => {
        if (input.getAttribute('alt')?.trim() || input.getAttribute('aria-label')?.trim()) return;

        logError(`<input type="image"> without alt text: ${describeElement(input)}.`);
        highlight(input, { outline: '2px dashed green', title: '❌ Missing alt text' });
    });
}
