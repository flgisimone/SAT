/**
 * DOM helpers shared by all checkers.
 * `queryTargets` skips SAT's own UI (anything inside [data-sat-ignore]).
 */

export const SAT_IGNORE_SELECTOR = '[data-sat-ignore]';

export function isSatElement(el: Element): boolean {
    return el.closest(SAT_IGNORE_SELECTOR) !== null;
}

export function queryTargets<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] {
    return Array.from(root.querySelectorAll<T>(selector)).filter((el) => !isSatElement(el));
}

/** Computed style from the element's own window, so elements of other documents (iframes) work too. */
export function computedStyle(el: Element): CSSStyleDeclaration {
    return (el.ownerDocument.defaultView ?? window).getComputedStyle(el);
}

export function isElementVisible(el: Element): boolean {
    const withCheck = el as Element & { checkVisibility?: (options?: Record<string, boolean>) => boolean };
    if (typeof withCheck.checkVisibility === 'function') {
        return withCheck.checkVisibility({
            opacityProperty: true,
            visibilityProperty: true,
            checkOpacity: true,
            checkVisibilityCSS: true,
        });
    }

    const style = computedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    return el.getClientRects().length > 0;
}

export function isAriaHidden(el: Element): boolean {
    return el.closest('[aria-hidden="true"]') !== null;
}

/**
 * Rendered (HTML "being rendered"): not display: none on the element or an ancestor, not visibility: hidden.
 * Transparent and off-screen elements are rendered. Without checkVisibility (jsdom) the computed
 * styles of the ancestors are read instead.
 */
export function isRendered(el: Element): boolean {
    const withCheck = el as Element & { checkVisibility?: (options?: Record<string, boolean>) => boolean };
    if (typeof withCheck.checkVisibility === 'function') {
        if (withCheck.checkVisibility({ visibilityProperty: true })) return true;
        // display: contents (e.g. <picture> in some sites) has no box of its own, but its children are rendered.
        const style = computedStyle(el);
        return style.display === 'contents' && style.visibility !== 'hidden' && (!el.parentElement || isRendered(el.parentElement));
    }

    for (let node: Element | null = el; node; node = node.parentElement) {
        if (computedStyle(node).display === 'none') return false;
    }
    return computedStyle(el).visibility !== 'hidden';
}

/**
 * Hidden with the "visually hidden" pattern, on the element or an ancestor: clipped away
 * (clip-path: inset(50%), clip: rect(0 0 0 0)) or squeezed into a box of 1 px with overflow hidden.
 * Screen readers read it, sighted users don't see it. Needs layout: false in jsdom.
 */
export function isVisuallyHidden(el: Element): boolean {
    if (el.getClientRects().length === 0) return false;
    for (let node: Element | null = el; node && node !== el.ownerDocument.body; node = node.parentElement) {
        const style = computedStyle(node);
        if (/^inset\((50|100)%/.test(style.clipPath) || /^rect\(0px,? 0px,? 0px,? 0px\)$/.test(style.clip)) return true;
        const rect = node.getBoundingClientRect();
        if ((rect.width <= 1 || rect.height <= 1) && style.overflow !== 'visible') return true;
    }
    return false;
}

/** Not in the accessibility tree (HTML-AAM): aria-hidden, or not rendered. */
export function isHiddenFromAssistiveTech(el: Element): boolean {
    return isAriaHidden(el) || !isRendered(el);
}

const NATIVE_FOCUSABLE = 'a[href], area[href], button, input:not([type="hidden" i]), select, textarea, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false" i])';

/** The tabindex value parsed with HTML's rules for parsing integers, or null without a valid one. */
export function tabIndexValue(el: Element): number | null {
    const value = parseInt(el.getAttribute('tabindex') ?? '', 10);
    return Number.isNaN(value) ? null : value;
}

/**
 * In the sequential focus navigation order (reachable with Tab): rendered, not inert or disabled,
 * natively focusable or with tabindex >= 0, and not taken out with a negative tabindex.
 * The summary of a <details> is focusable; elements that move focus away with a script are not detected.
 */
export function isInTabOrder(el: Element): boolean {
    if (!isRendered(el) || el.closest('[inert]') || el.matches(':disabled')) return false;
    const tabIndex = tabIndexValue(el);
    if (tabIndex !== null) return tabIndex >= 0;
    return el.matches(NATIVE_FOCUSABLE) || isDetailsSummary(el);
}

/** The first <summary> child of a <details>: the one that toggles it. */
export function isDetailsSummary(el: Element): boolean {
    return el.tagName === 'SUMMARY' && el.parentElement?.tagName === 'DETAILS' && el.parentElement.querySelector(':scope > summary') === el;
}

function normalizeSpace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

/** Text of the elements an aria-labelledby points to, hidden ones included (accname 1.2, step 2B). */
function labelledByText(el: Element): string {
    const ids = el.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? [];
    return normalizeSpace(ids.map((id) => {
        const target = id ? el.ownerDocument.getElementById(id) : null;
        return target ? textAlternative(target, true) : '';
    }).join(' '));
}

/**
 * Name from aria-labelledby, aria-label or title only: for elements whose role takes no name from
 * their content (iframe, object).
 */
export function getExplicitName(el: Element): string {
    return labelledByText(el) || normalizeSpace(el.getAttribute('aria-label') ?? '') || normalizeSpace(el.getAttribute('title') ?? '');
}

/**
 * Text alternative of a node, after the accessible name computation (accname 1.2): aria-labelledby,
 * aria-label, the <label> elements of a labelable element (HTML-AAM, e.g. <button role="checkbox">
 * with <label for>), alt of images (none for presentational ones), <title> of an SVG, the content, title.
 * Content hidden from assistive technologies is skipped, except inside an aria-labelledby target.
 * `named` holds the elements whose name is being computed, so a label that contains its control
 * doesn't loop.
 */
function textAlternative(el: Element, inLabelledBy: boolean, named: Set<Element> = new Set()): string {
    if (!inLabelledBy) {
        const labelled = labelledByText(el);
        if (labelled) return labelled;
    }
    const label = normalizeSpace(el.getAttribute('aria-label') ?? '');
    if (label) return label;

    const labels = (el as HTMLButtonElement).labels;
    if (labels?.length) {
        named.add(el);
        const text = normalizeSpace(Array.from(labels, (labelEl) => textAlternative(labelEl, inLabelledBy, named)).join(' '));
        if (text) return text;
    }

    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role')?.trim().toLowerCase().split(/\s+/)[0];
    if (tag === 'img' || tag === 'area' || (tag === 'input' && (el as HTMLInputElement).type === 'image')) {
        if (role === 'none' || role === 'presentation') return '';
        const alt = normalizeSpace(el.getAttribute('alt') ?? '');
        if (alt) return alt;
    } else if (tag === 'svg') {
        const title = normalizeSpace(el.querySelector(':scope > title')?.textContent ?? '');
        if (title) return title;
    } else if (tag !== 'br') {
        const content = normalizeSpace(Array.from(el.childNodes, (node) => {
            if (node.nodeType === 3) return node.textContent ?? '';
            if (node.nodeType !== 1) return '';
            const child = node as Element;
            if (named.has(child) || (!inLabelledBy && isHiddenFromAssistiveTech(child))) return '';
            return ` ${textAlternative(child, inLabelledBy, named)} `;
        }).join(''));
        if (content) return content;
    }
    return normalizeSpace(el.getAttribute('title') ?? '');
}

/**
 * Accessible name of an element whose role takes its name from the content (buttons, links,
 * headings, menu items, summary): aria-labelledby, aria-label, <label>, the visible content with image
 * alternatives, title. Whitespace is collapsed.
 */
export function getAccessibleName(el: Element): string {
    return textAlternative(el, false);
}

/**
 * Short, human-readable description of an element to help locate it.
 * Example: <button id="save" class="btn primary"> "Save"
 */
export function describeElement(el: Element): string {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? ` id="${el.id}"` : '';
    const cls = el.getAttribute('class')?.trim();
    const classPart = cls ? ` class="${cls}"` : '';
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
    const textPart = text ? ` "${text.length > 60 ? text.slice(0, 60) + '…' : text}"` : '';
    return `<${tag}${id}${classPart}>${textPart}`;
}
