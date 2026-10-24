import { computedStyle, describeElement, getAccessibleName, isHiddenFromAssistiveTech, isRendered, isVisuallyHidden, queryTargets } from "../../../sat/satDom";
import { semanticRole } from "../aria";
import type { Rule } from "../rule";

/** Widget roles that take their name from the content (ACT 2ee8b8). */
const WIDGET_ROLES = ['button', 'checkbox', 'gridcell', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'radio', 'switch', 'tab', 'treeitem'];
/** Icon fonts draw ligatures such as "search" as a symbol: that text is not a visible label. */
const ICON_FONT = /^["']?[^,]*(icons?\b|symbols|awesome|icomoon|glyphicons)/i;
/** Keyboard shortcuts, and SVG content that is not drawn where it is (masks, definitions). */
const NOT_LABEL = ['kbd', 'defs', 'mask', 'clippath', 'symbol', 'pattern', 'title', 'desc', 'style', 'script', 'template'];

/** Content moved outside a parent that clips it (overflow: hidden), e.g. the second copy of a label in a hover animation. */
function isClippedOut(el: Element, widget: Element): boolean {
    if (el.getClientRects().length === 0) return false;
    const rect = el.getBoundingClientRect();
    for (let node = el.parentElement; node; node = node === widget ? null : node.parentElement) {
        const { overflowX, overflowY } = computedStyle(node);
        if (overflowX === 'visible' && overflowY === 'visible') continue;
        const box = node.getBoundingClientRect();
        if (rect.right <= box.left || rect.left >= box.right || rect.bottom <= box.top || rect.top >= box.bottom) return true;
    }
    return false;
}

/**
 * The text a sighted user reads in the widget: rendered text, aria-hidden included, without visually
 * hidden, transparent or clipped text, icon-font ligatures, SVG masks and keyboard shortcuts (<kbd>,
 * e.g. "⌘K" next to "Search"); block elements and <br> separate words.
 */
function visibleText(el: Element, widget: Element = el): string {
    return Array.from(el.childNodes, (node) => {
        if (node.nodeType === 3) return ICON_FONT.test(computedStyle(el).fontFamily) ? '' : node.textContent;
        if (node.nodeType !== 1) return '';
        const child = node as Element;
        if (child.tagName === 'BR') return ' ';
        if (NOT_LABEL.includes(child.localName.toLowerCase()) || computedStyle(child).opacity === '0') return '';
        if (!isRendered(child) || isVisuallyHidden(child) || isClippedOut(child, widget)) return '';
        const text = visibleText(child, widget);
        return computedStyle(child).display.startsWith('inline') ? text : ` ${text} `;
    }).join('');
}

/**
 * Words of a label for the comparison (ACT "label in name algorithm"): text in parentheses removed,
 * case folded, everything that is not a letter or a digit treated as a space.
 */
function words(text: string): string[] {
    return text.replace(/\([^)]*\)/g, ' ').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').filter(Boolean);
}

function containsInOrder(name: string[], label: string[]): boolean {
    for (let start = 0; start + label.length <= name.length; start++) {
        if (label.every((word, i) => name[start + i] === word)) return true;
    }
    return false;
}

/**
 * The visible label is part of the accessible name (ACT 2ee8b8, WCAG 2.5.3): speech-input users
 * say what they see. Applies to widgets named from their content (buttons, links, tabs…) that
 * also have aria-label or aria-labelledby. The words of the visible text must appear in the name,
 * in the same order. A single letter (e.g. "X" for close) is a symbol and is not compared.
 */
export const labelInName: Rule = {
    id: 'label-in-name',
    title: 'Name contains the visible label',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['2.5.3'],
    run({ document, report }) {
        queryTargets('[aria-label], [aria-labelledby]', document).forEach((el) => {
            const role = semanticRole(el);
            if (!role || !WIDGET_ROLES.includes(role) || isHiddenFromAssistiveTech(el)) return;

            const visible = visibleText(el);
            const label = words(visible);
            if (label.length === 0 || (label.length === 1 && /^\p{L}$/u.test(label[0]))) return;

            const name = getAccessibleName(el);
            if (containsInOrder(words(name), label)) return;

            report({
                element: el,
                message: `The visible label "${visible.replace(/\s+/g, ' ').trim()}" is not part of the accessible name "${name}" of ${describeElement(el)}. Start the aria-label with the visible text, or remove it.`,
            });
        });
    },
};
