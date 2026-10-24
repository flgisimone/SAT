import { describeElement, isHiddenFromAssistiveTech, queryTargets } from "../../../sat/satDom";
import { ARIA_ATTRIBUTES, explicitRole, isFocusable, ROLE_ATTRIBUTES, semanticRole } from "../aria";
import { implicitRole } from "./aria-roles";
import type { Rule } from "../rule";

const INTEGER = /^-?\d+$/;
const NUMBER = /^-?(\d+(\.\d+)?|\.\d+)([eE][-+]?\d+)?$/;

/** Why a non-empty value is invalid for its type, or null when it is valid. */
function invalidValue(name: string, value: string): string | null {
    const { type, values = [] } = ARIA_ATTRIBUTES[name];
    const lower = value.toLowerCase();
    switch (type) {
        case 'boolean':
            return lower === 'true' || lower === 'false' ? null : 'use true or false';
        case 'integer':
            return INTEGER.test(value) ? null : 'use an integer';
        case 'number':
            return NUMBER.test(value) ? null : 'use a number';
        case 'token':
            return values.includes(lower) ? null : `use one of ${values.join(', ')}`;
        case 'tokens':
            return lower.split(/\s+/).every((token) => values.includes(token)) ? null : `use one or more of ${values.join(', ')}`;
        default:
            return null;
    }
}

/** States that the native element already provides, so the role doesn't need the attribute. */
function hasNativeState(el: Element, attribute: string): boolean {
    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute('type') ?? '').toLowerCase();
    switch (attribute) {
        case 'checked':
            return tag === 'input' && (type === 'checkbox' || type === 'radio');
        case 'valuenow':
            return tag === 'meter' || tag === 'progress' || (tag === 'input' && (type === 'range' || type === 'number'));
        case 'level':
            return /^h[1-6]$/.test(tag);
        default:
            return false;
    }
}

function requiredAttributes(el: Element, role: string): string[] {
    if (role === 'separator') return isFocusable(el) ? ['valuenow'] : [];
    return ROLE_ATTRIBUTES[role].required?.split(' ') ?? [];
}

/**
 * ARIA states and properties (WAI-ARIA 1.2, WCAG 4.1.2), after the ACT rules:
 * - 5f99a7: every aria-* attribute exists;
 * - 6a7281: its value is valid for its type (empty values are ignored);
 * - 4e8ab6: an explicit role has its required states (native ones count, e.g. a checkbox input);
 * - 5c01ea: non-global attributes are supported by the element's role;
 * - kb1m8s: global attributes the role prohibits (aria-label on a generic <div> or a <p>).
 * Role checks skip elements hidden from assistive technologies and roles not known here.
 */
export const ariaAttributes: Rule = {
    id: 'aria-attributes',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['4.1.2'],
    run({ document, report }) {
        queryTargets('*', document).forEach((el) => {
            const attributes = el.getAttributeNames().filter((name) => name.startsWith('aria-'));
            const explicit = explicitRole(el);
            if (attributes.length === 0 && !explicit) return;

            const desc = describeElement(el);
            const known: string[] = [];
            for (const attribute of attributes) {
                const name = attribute.slice(5);
                if (!(name in ARIA_ATTRIBUTES)) {
                    report({ element: el, message: `Unknown ARIA attribute ${attribute} on ${desc}. Check the spelling.` });
                    continue;
                }
                known.push(name);
                const value = el.getAttribute(attribute)!.trim();
                const problem = value ? invalidValue(name, value) : null;
                if (problem) report({ element: el, message: `Invalid value ${attribute}="${value}" on ${desc}: ${problem}.` });
            }

            if (isHiddenFromAssistiveTech(el)) return;
            const role = semanticRole(el);
            if (!role) return;
            const { allowed, prohibited = '' } = ROLE_ATTRIBUTES[role];

            if (explicit === role && explicit !== implicitRole(el)) {
                const missing = requiredAttributes(el, role).filter((name) => !el.getAttribute(`aria-${name}`)?.trim() && !hasNativeState(el, name));
                if (missing.length) {
                    report({ element: el, message: `role="${role}" requires ${missing.map((name) => `aria-${name}`).join(', ')}, missing on ${desc}.` });
                }
            }

            for (const name of known) {
                if (prohibited.split(' ').includes(name)) {
                    report({ element: el, message: `aria-${name} is not allowed on ${desc} (role ${role}): this role can't be named. Remove it, or use an element or role that can.` });
                } else if (!ARIA_ATTRIBUTES[name].global && !allowed.split(' ').includes(name)) {
                    report({ element: el, message: `aria-${name} is not supported by role ${role} on ${desc}. Remove it or change the role.` });
                }
            }
        });
    },
};
