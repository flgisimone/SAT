import { logError } from "../../sat/satLogger";
import { describeElement, getAccessibleName, highlight, isAriaHidden, queryTargets } from "../../sat/satDom";

const NAMED_CONTROLS = 'button, a[href], [role="button"], [role="link"], [role="menuitem"], [role="tab"]';

/**
 * Checks that interactive controls and meaningful icons have an accessible name.
 *
 * - Buttons and links need text, aria-label, aria-labelledby, title, or a labelled image/icon.
 * - <svg role="img"> needs a <title>, aria-label or aria-labelledby.
 * Form fields are covered by `checkInputLabels`.
 */
export function checkAriaLabel(enableCheckAriaLabel?: boolean) {
    if (!enableCheckAriaLabel) return;

    queryTargets<HTMLElement>(NAMED_CONTROLS).forEach((el) => {
        if (isAriaHidden(el)) return;
        if (getAccessibleName(el)) return;

        logError(`Missing accessible name on ${describeElement(el)}. Add visible text, aria-label or aria-labelledby.`);
        highlight(el, {
            outline: '2px solid red',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            title: '❌ Missing accessible name',
        });
    });

    queryTargets<SVGElement>('svg[role="img"]').forEach((svg) => {
        if (isAriaHidden(svg)) return;
        // Icons inside a named control are described by the control itself.
        if (svg.parentElement?.closest(NAMED_CONTROLS)) return;

        const hasName =
            !!svg.getAttribute('aria-label')?.trim() ||
            svg.hasAttribute('aria-labelledby') ||
            !!svg.querySelector('title')?.textContent?.trim();

        if (!hasName) {
            logError(`<svg role="img"> without a <title> or aria-label: ${describeElement(svg)}. Add a name, or use aria-hidden="true" if decorative.`);
            highlight(svg, { outline: '2px solid red', title: '❌ Missing accessible name' });
        }
    });
}
