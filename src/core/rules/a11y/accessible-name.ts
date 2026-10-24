import { describeElement, getAccessibleName, isHiddenFromAssistiveTech, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

const NAMED_CONTROLS = 'button, a[href], [role="button"], [role="link"], [role="menuitem"], [role="tab"]';

/**
 * Interactive controls and meaningful icons have an accessible name (WCAG 4.1.2, 1.1.1).
 *
 * - Buttons and links need text, aria-label, aria-labelledby, title, or a labelled image/icon.
 * - <svg role="img"> needs a <title>, aria-label or aria-labelledby.
 * Form fields are covered by `form-label`. Elements hidden from assistive technologies are skipped.
 */
export const accessibleName: Rule = {
    id: 'accessible-name',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['4.1.2'],
    run({ document, report }) {
        queryTargets<HTMLElement>(NAMED_CONTROLS, document).forEach((el) => {
            if (isHiddenFromAssistiveTech(el) || getAccessibleName(el)) return;

            report({
                element: el,
                message: `Missing accessible name on ${describeElement(el)}. Add visible text, aria-label or aria-labelledby.`,
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
    },
};
