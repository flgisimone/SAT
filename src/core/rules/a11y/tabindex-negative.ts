import { describeElement, isAriaHidden, isElementVisible, isInTabOrder, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

const NATIVE_CONTROLS = 'a[href], button, input:not([type="hidden"]), select, textarea, summary';
/** Composite widgets that keep one item in the tab order and move focus with the arrow keys (roving tabindex). */
const COMPOSITE = '[role="tablist"], [role="radiogroup"], [role="menu"], [role="menubar"], [role="listbox"], [role="tree"], [role="treegrid"], [role="grid"], [role="toolbar"]';

/** Inside a composite widget that the keyboard reaches: through another item, or the widget itself (aria-activedescendant). */
function isRovingItem(el: Element): boolean {
    const group = el.closest(COMPOSITE);
    if (!group) return false;
    return isInTabOrder(group) || Array.from(group.querySelectorAll(`${NATIVE_CONTROLS}, [tabindex]`)).some(isInTabOrder);
}

/**
 * Visible native controls taken out of the tab order with tabindex="-1" (WCAG 2.1.1).
 * Such controls can be clicked with a mouse but not reached with the keyboard.
 *
 * tabindex="-1" on non-interactive elements (modals, skip-link targets, headings
 * focused by code) is the correct pattern and is not reported, and so are the items of a tab list,
 * radio group, menu, listbox, tree, grid or toolbar that the keyboard reaches through another item
 * (roving tabindex, WAI-ARIA Authoring Practices).
 */
export const tabindexNegative: Rule = {
    id: 'tabindex-negative',
    title: 'Controls stay in the tab order',
    category: 'a11y',
    defaultSeverity: 'warning',
    wcag: ['2.1.1'],
    run({ document, report }) {

        queryTargets<HTMLElement>('[tabindex="-1"]', document).forEach((el) => {
            if (!el.matches(NATIVE_CONTROLS)) return;
            if ((el as HTMLButtonElement).disabled || isAriaHidden(el) || !isElementVisible(el)) return;
            if (isRovingItem(el)) return;

            report({
                element: el,
                message: `${describeElement(el)} is visible and interactive but has tabindex="-1", so keyboard users can't reach it.`,
            });
        });
    },
};
