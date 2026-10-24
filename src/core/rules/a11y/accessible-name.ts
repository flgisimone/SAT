import { describeElement, getAccessibleName, getExplicitName, isDetailsSummary, isHiddenFromAssistiveTech, queryTargets } from "../../../sat/satDom";
import { explicitRole, isFocusable } from "../aria";
import type { Rule } from "../rule";

const NAMED_CONTROLS = 'button, a[href], [role="button"], [role="link"], [role="menuitem"], [role="tab"]';
const HEADINGS = 'h1, h2, h3, h4, h5, h6, [role]';

/** Files an <object> shows as an image, audio or video (ACT 8fc3b6): the others embed documents. */
const NON_TEXT_OBJECT = /^(image|audio|video)\//;
const NON_TEXT_EXTENSION = /\.(apng|avif|bmp|gif|ico|jpe?g|png|svg|webp|aac|flac|m4a|mp3|oga|ogg|opus|wav|weba|m4v|mov|mp4|ogv|webm)$/i;

/** True when the heading role applies: explicit, or implicit on <h1>–<h6> unless another role replaces it. */
function isHeading(el: Element): boolean {
    const role = explicitRole(el);
    if (role === 'heading') return true;
    if (!/^H[1-6]$/.test(el.tagName)) return false;
    if (!role) return true;
    // A presentational role is ignored on focusable elements and on those with global ARIA attributes.
    return (role === 'none' || role === 'presentation') && (isFocusable(el) || el.getAttributeNames().some((name) => name.startsWith('aria-')));
}

function rendersNonText(object: HTMLObjectElement): boolean {
    const type = object.getAttribute('type')?.trim().toLowerCase();
    if (type) return NON_TEXT_OBJECT.test(type);
    const data = object.getAttribute('data')?.split(/[?#]/)[0] ?? '';
    return NON_TEXT_EXTENSION.test(data);
}

/**
 * Interactive controls, headings and non-text content have an accessible name (WCAG 4.1.2, 1.1.1).
 *
 * - Buttons, links, menu items, tabs and the summary of a <details> (ACT 97a4e1, m6b1q3, 2t702h):
 *   text, aria-label, aria-labelledby, title, or a labelled image/icon.
 * - Headings (ACT ffd0e9): an empty heading is announced as a heading with nothing in it.
 * - <svg role="img">, and <object> showing an image, audio or video (ACT 8fc3b6): a <title>,
 *   title, aria-label or aria-labelledby.
 * Form fields are covered by `form-label`. Elements hidden from assistive technologies are skipped.
 */
export const accessibleName: Rule = {
    id: 'accessible-name',
    title: 'Elements have an accessible name',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['4.1.2'],
    run({ document, report }) {
        queryTargets<HTMLElement>(`${NAMED_CONTROLS}, summary`, document).forEach((el) => {
            if (el.tagName === 'SUMMARY' && !el.matches(NAMED_CONTROLS) && !isDetailsSummary(el)) return;
            if (isHiddenFromAssistiveTech(el) || getAccessibleName(el)) return;

            report({
                element: el,
                message: `Missing accessible name on ${describeElement(el)}. Add visible text, aria-label or aria-labelledby.`,
            });
        });

        queryTargets(HEADINGS, document).forEach((heading) => {
            if (!isHeading(heading) || isHiddenFromAssistiveTech(heading) || getAccessibleName(heading)) return;

            report({
                element: heading,
                message: `Empty heading ${describeElement(heading)}: screen readers announce a heading with no text. Add text, or remove the element if it is only used for spacing.`,
                wcag: [],
            });
        });

        queryTargets<SVGElement>('svg[role="img"]', document).forEach((svg) => {
            if (isHiddenFromAssistiveTech(svg)) return;
            // Icons inside a named control are described by the control itself.
            if (svg.parentElement?.closest(NAMED_CONTROLS)) return;

            const hasName =
                !!svg.getAttribute('aria-label')?.trim() ||
                svg.hasAttribute('aria-labelledby') ||
                !!svg.querySelector('title')?.textContent?.trim();

            if (!hasName) {
                report({
                    element: svg,
                    message: `<svg role="img"> without a <title> or aria-label: ${describeElement(svg)}. Add a name, or use aria-hidden="true" if decorative.`,
                    wcag: ['1.1.1'],
                });
            }
        });

        queryTargets<HTMLObjectElement>('object:not([role])', document).forEach((object) => {
            if (!rendersNonText(object) || isHiddenFromAssistiveTech(object) || getExplicitName(object)) return;

            report({
                element: object,
                message: `<object data="${object.getAttribute('data')}"> without a text alternative. Add a title, aria-label or aria-labelledby that describes it (fallback content inside <object> is not used when the file loads).`,
                wcag: ['1.1.1'],
            });
        });
    },
};
