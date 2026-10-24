import { computedStyle, describeElement, isElementVisible, isVisuallyHidden, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/** WCAG 2.5.8: 24 × 24 CSS pixels, and a 24 px circle for the spacing exception. */
const MIN_SIZE = 24;
const RADIUS = MIN_SIZE / 2;
/** Sub-pixel rounding: a 23.99 px box is 24 px on screen. */
const TOLERANCE = 0.05;

const TARGETS = 'a[href], area[href], button, input:not([type="hidden" i]), select, textarea, summary, ' +
    '[role="button" i], [role="link" i], [role="checkbox" i], [role="radio" i], [role="switch" i], [role="tab" i], ' +
    '[role="menuitem" i], [role="menuitemcheckbox" i], [role="menuitemradio" i], [role="option" i], [role="slider" i], [role="treeitem" i]';

/** Edges as plain numbers: the neighbour search reads them for every pair, and DOMRect getters are slow. */
interface Target {
    el: Element;
    left: number;
    top: number;
    right: number;
    bottom: number;
    small: boolean;
    cx: number;
    cy: number;
}

/** Checkboxes and radios drawn by the browser: their size is the user agent's (WCAG 2.5.8 exception). */
function isUserAgentControl(el: Element): boolean {
    const type = el.tagName === 'INPUT' ? (el as HTMLInputElement).type : '';
    return (type === 'checkbox' || type === 'radio') && computedStyle(el).appearance !== 'none';
}

/** An inline target in a line of text (WCAG 2.5.8 inline exception): its size follows the line height. */
function isInText(el: Element): boolean {
    if (computedStyle(el).display !== 'inline') return false;
    let block = el.parentElement;
    while (block && computedStyle(block).display.startsWith('inline')) block = block.parentElement;
    if (!block) return false;

    const walker = el.ownerDocument.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!el.contains(node) && node.textContent!.trim() && !node.parentElement?.closest(TARGETS)) return true;
    }
    return false;
}

/** Squared distance from a point to a target's box (0 inside it). */
function squaredDistanceToBox(x: number, y: number, box: Target): number {
    const dx = Math.max(box.left - x, 0, x - box.right);
    const dy = Math.max(box.top - y, 0, y - box.bottom);
    return dx * dx + dy * dy;
}

/** The 24 px circle centred on a small target touches the other target, or its circle if it is small too. */
function tooClose(small: Target, other: Target): boolean {
    // Quick reject: farther than 24 px on one axis.
    if (other.left - small.cx >= MIN_SIZE || small.cx - other.right >= MIN_SIZE || other.top - small.cy >= MIN_SIZE || small.cy - other.bottom >= MIN_SIZE) return false;
    if (squaredDistanceToBox(small.cx, small.cy, other) < RADIUS * RADIUS) return true;
    const dx = small.cx - other.cx;
    const dy = small.cy - other.cy;
    return other.small && dx * dx + dy * dy < MIN_SIZE * MIN_SIZE;
}

/**
 * Pointer targets of at least 24 × 24 CSS pixels (WCAG 2.2, 2.5.8 Target Size Minimum, AA).
 * A smaller target passes when a 24 px circle centred on it doesn't touch other targets or their
 * circles (spacing exception). Inline links in text and browser-drawn checkboxes and radios are
 * exceptions; visually hidden targets (skip links until they get focus) are not pointer targets.
 * Needs layout: in jsdom nothing is reported. Equivalent controls elsewhere on the page can't be
 * detected.
 */
export const targetSize: Rule = {
    id: 'target-size',
    title: 'Targets are large enough',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['2.5.8'],
    run({ document, report }) {
        const targets: Target[] = [];
        queryTargets(TARGETS, document).forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0 || el.matches(':disabled') || !isElementVisible(el)) return;
            const { left, top, right, bottom, width, height } = rect;
            const small = width < MIN_SIZE - TOLERANCE || height < MIN_SIZE - TOLERANCE;
            targets.push({ el, left, top, right, bottom, small, cx: left + width / 2, cy: top + height / 2 });
        });

        // Visually hidden targets are not pointer targets; checked only where it matters, since it walks the ancestors.
        const hidden = new Map<Element, boolean>();
        const isHidden = (el: Element) => hidden.get(el) ?? hidden.set(el, isVisuallyHidden(el)).get(el)!;

        targets.filter((target) => target.small).forEach((target) => {
            const neighbour = targets.find((other) => other !== target && tooClose(target, other)
                && !other.el.contains(target.el) && !target.el.contains(other.el) && !isHidden(other.el));
            if (!neighbour || isUserAgentControl(target.el) || isInText(target.el) || isHidden(target.el)) return;

            const width = target.right - target.left;
            const height = target.bottom - target.top;
            report({
                element: target.el,
                message: `${describeElement(target.el)} is ${Math.round(width)}×${Math.round(height)} px, smaller than 24×24, and too close to ${describeElement(neighbour.el)}. Make it at least 24×24 px or leave more space around it.`,
            });
        });
    },
};
