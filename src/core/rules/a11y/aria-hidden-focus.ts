import { describeElement, isAriaHidden, isInTabOrder, isRendered, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/**
 * The open modal dialog: <dialog> opened with showModal(), or a rendered dialog outside aria-hidden.
 * Libraries such as Radix hide the background with aria-hidden instead of setting aria-modal.
 */
function openModal(document: Document): Element | null {
    let modal: Element | null = null;
    try {
        modal = document.querySelector('dialog:modal');
    } catch {
        // :modal is not supported (jsdom).
    }
    return modal ?? queryTargets('[role="dialog" i], [role="alertdialog" i]', document).find((el) => isRendered(el) && !isAriaHidden(el)) ?? null;
}

/**
 * Nothing reachable with Tab inside aria-hidden="true" (ACT 6cfa84, WCAG 4.1.2): keyboard users
 * would land on content that screen readers don't announce. aria-hidden="false" on a descendant
 * doesn't undo it. tabindex="-1", disabled, inert and not rendered elements are fine.
 * Behind an open modal dialog the content is hidden on purpose (WAI-ARIA dialog pattern) and the
 * dialog keeps the focus inside with a script, which can't be seen here: a warning, not an error.
 * Sentinels that move focus away with a script can't be told apart either.
 */
export const ariaHiddenFocus: Rule = {
    id: 'aria-hidden-focus',
    title: 'Hidden content is not focusable',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['4.1.2'],
    run({ document, report }) {
        const modal = openModal(document);
        const reported = new Set<Element>();
        queryTargets('[aria-hidden]', document).forEach((hidden) => {
            if (hidden.getAttribute('aria-hidden')!.trim().toLowerCase() !== 'true') return;

            [hidden, ...hidden.querySelectorAll('*')].forEach((el) => {
                if (reported.has(el) || !isInTabOrder(el)) return;
                reported.add(el);
                const behindModal = !!modal && !modal.contains(el);
                report({
                    element: el,
                    message: behindModal
                        ? `${describeElement(el)} is behind the open modal dialog, inside aria-hidden="true", and still in the tab order. Fine if the dialog keeps the focus inside it; otherwise make the background inert.`
                        : `${describeElement(el)} can receive keyboard focus but is inside aria-hidden="true", so screen readers don't announce it. Remove aria-hidden, or take it out of the tab order (tabindex="-1", disabled or inert).`,
                    ...(behindModal && { severity: 'warning' as const }),
                });
            });
        });
    },
};
