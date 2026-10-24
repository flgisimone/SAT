/**
 * DOM helpers shared by all checkers.
 *
 * - `queryTargets` skips SAT's own UI (anything inside [data-sat-ignore]).
 * - `highlight` remembers the element's original inline styles and title,
 *   so `clearHighlights` can restore them instead of wiping the host app's styles.
 */

export const SAT_IGNORE_SELECTOR = '[data-sat-ignore]';

type StylableElement = HTMLElement | SVGElement;

interface SavedState {
    outline: string;
    backgroundColor: string;
    title: string | null;
}

export interface HighlightStyle {
    outline?: string;
    backgroundColor?: string;
    title?: string;
}

const originals = new Map<StylableElement, SavedState>();

export function isSatElement(el: Element): boolean {
    return el.closest(SAT_IGNORE_SELECTOR) !== null;
}

export function queryTargets<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] {
    return Array.from(root.querySelectorAll<T>(selector)).filter((el) => !isSatElement(el));
}

export function highlight(el: Element, style: HighlightStyle): void {
    const target = el as StylableElement;
    if (!target.style || isSatElement(el)) return;

    if (!originals.has(target)) {
        originals.set(target, {
            outline: target.style.outline,
            backgroundColor: target.style.backgroundColor,
            title: target.getAttribute('title'),
        });
    }

    if (style.outline !== undefined) target.style.outline = style.outline;
    if (style.backgroundColor !== undefined) target.style.backgroundColor = style.backgroundColor;
    if (style.title !== undefined) target.setAttribute('title', style.title);
}

export function clearHighlights(): void {
    originals.forEach((saved, el) => {
        el.style.outline = saved.outline;
        el.style.backgroundColor = saved.backgroundColor;
        if (saved.title === null) {
            el.removeAttribute('title');
        } else {
            el.setAttribute('title', saved.title);
        }
    });
    originals.clear();
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
 * Approximates the accessible name of an element: aria-label, aria-labelledby,
 * text content, title, or labelled images/icons inside it.
 */
export function getAccessibleName(el: Element): string {
    const ariaLabel = el.getAttribute('aria-label')?.trim();
    if (ariaLabel) return ariaLabel;

    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
        const text = labelledBy
            .split(/\s+/)
            .map((id) => el.ownerDocument.getElementById(id)?.textContent?.trim() || '')
            .join(' ')
            .trim();
        if (text) return text;
    }

    const text = el.textContent?.trim();
    if (text) return text;

    const img = el.querySelector('img[alt]:not([alt=""])');
    if (img) return img.getAttribute('alt')!.trim();

    const labelledIcon = el.querySelector('svg[aria-label], [role="img"][aria-label]');
    if (labelledIcon) return labelledIcon.getAttribute('aria-label')!.trim();

    const svgTitle = el.querySelector('svg title')?.textContent?.trim();
    if (svgTitle) return svgTitle;

    return el.getAttribute('title')?.trim() || '';
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
