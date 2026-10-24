import { describeElement, isHiddenFromAssistiveTech, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/** Autofill field names of the HTML standard ("autofill detail tokens"). */
const FIELDS = new Set(('name honorific-prefix given-name additional-name family-name honorific-suffix nickname username ' +
    'new-password current-password one-time-code organization-title organization street-address address-line1 ' +
    'address-line2 address-line3 address-level4 address-level3 address-level2 address-level1 country country-name ' +
    'postal-code cc-name cc-given-name cc-additional-name cc-family-name cc-number cc-exp cc-exp-month cc-exp-year ' +
    'cc-csc cc-type transaction-currency transaction-amount language bday bday-day bday-month bday-year sex url photo').split(' '));
/** Field names that can follow a contact type (home, work…). */
const CONTACT_FIELDS = new Set('tel tel-country-code tel-national tel-area-code tel-local tel-local-prefix tel-local-suffix tel-extension email impp'.split(' '));
const CONTACT_TYPES = new Set('home work mobile fax pager'.split(' '));

/**
 * True for a valid autocomplete value: "on", "off", or
 * [section-*] [shipping|billing] [home|work|mobile|fax|pager] field [webauthn], in this order,
 * with the contact type only before a contact field (tel, email, impp…). Case-insensitive.
 */
export function isValidAutocomplete(value: string): boolean {
    const tokens = value.trim().toLowerCase().split(/\s+/);
    if (tokens.length === 1 && (tokens[0] === 'on' || tokens[0] === 'off')) return true;

    let i = 0;
    if (tokens[i].startsWith('section-')) i++;
    if (tokens[i] === 'shipping' || tokens[i] === 'billing') i++;
    if (CONTACT_TYPES.has(tokens[i])) {
        i++;
        if (!CONTACT_FIELDS.has(tokens[i])) return false;
    } else if (!FIELDS.has(tokens[i]) && !CONTACT_FIELDS.has(tokens[i])) {
        return false;
    }
    i++;
    if (tokens[i] === 'webauthn') i++;
    return i === tokens.length;
}

/**
 * Valid autocomplete values on form fields (ACT 73f2c2, WCAG 1.3.5): browsers and assistive
 * technologies use them to fill in and identify personal data. Empty values, disabled fields and
 * fields hidden from assistive technologies are skipped.
 */
export const autocompleteValid: Rule = {
    id: 'autocomplete-valid',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['1.3.5'],
    run({ document, report }) {
        queryTargets<HTMLElement>('input[autocomplete], select[autocomplete], textarea[autocomplete]', document).forEach((field) => {
            const value = field.getAttribute('autocomplete')!.trim();
            const type = (field.getAttribute('type') ?? '').toLowerCase();
            if (!value || ['hidden', 'button', 'submit', 'reset', 'image'].includes(type)) return;
            if (field.matches(':disabled') || field.getAttribute('aria-disabled')?.trim().toLowerCase() === 'true') return;
            if (isHiddenFromAssistiveTech(field) || isValidAutocomplete(value)) return;

            report({
                element: field,
                message: `Invalid autocomplete="${value}" on ${describeElement(field)}. Use a field name of the HTML standard, e.g. "email", "given-name", "shipping postal-code" or "off".`,
            });
        });
    },
};
