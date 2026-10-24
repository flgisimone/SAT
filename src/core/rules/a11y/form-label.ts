import { describeElement, isHiddenFromAssistiveTech, queryTargets } from '../../../sat/satDom';
import type { Rule } from '../rule';

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
 * Form fields have an accessible label (WCAG 1.3.1, 4.1.2):
 * <label for>, wrapping <label>, aria-label, aria-labelledby or title.
 * A placeholder alone is not a label. Image buttons need an alt text.
 * Fields hidden from assistive technologies are skipped.
 */
export const formLabel: Rule = {
    id: 'form-label',
    title: 'Form fields have a label',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['1.3.1', '4.1.2'],
    run({ document, report }) {

        queryTargets<FormField>(FIELD_SELECTOR, document).forEach((field) => {
            if (isHiddenFromAssistiveTech(field) || fieldHasLabel(field)) return;

            const name = field.getAttribute('name') || 'unnamed';
            const placeholderNote = field.getAttribute('placeholder') ? ' A placeholder is not a replacement for a label.' : '';

            report({
                element: field,
                message: `Missing label for form field ${describeElement(field)} (name="${name}").${placeholderNote}`,
            });
        });

        queryTargets<HTMLInputElement>('input[type="image"]', document).forEach((input) => {
            if (isHiddenFromAssistiveTech(input) || input.getAttribute('alt')?.trim() || input.getAttribute('aria-label')?.trim()) return;

            report({
                element: input,
                message: `<input type="image"> without alt text: ${describeElement(input)}.`,
                wcag: ['1.1.1'],
            });
        });
    },
};
