import { logWarning } from "../../sat/satLogger";
import { describeElement, highlight, isAriaHidden, isElementVisible, queryTargets } from "../../sat/satDom";

const NATIVE_CONTROLS = 'a[href], button, input:not([type="hidden"]), select, textarea, summary';

/**
 * Checks for visible native controls taken out of the tab order with tabindex="-1".
 * Such controls can be clicked with a mouse but not reached with the keyboard.
 *
 * tabindex="-1" on non-interactive elements (modals, skip-link targets, headings
 * focused by code) is the correct pattern and is not reported.
 */
export function checkTabindexNegativeOne(enableCheckTabindexNegativeOne?: boolean): void {
    if (!enableCheckTabindexNegativeOne) return;

    queryTargets<HTMLElement>('[tabindex="-1"]').forEach((el) => {
        if (!el.matches(NATIVE_CONTROLS)) return;
        if ((el as HTMLButtonElement).disabled || isAriaHidden(el) || !isElementVisible(el)) return;

        const msg = `${describeElement(el)} is visible and interactive but has tabindex="-1", so keyboard users can't reach it.`;
        logWarning(msg);
        highlight(el, { outline: '2px dashed #FFA500', title: '⚠️ Interactive element removed from tab order' });
    });
}
