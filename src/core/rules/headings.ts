import { queryTargets } from "../../sat/satDom";

export const HEADINGS = 'h1, h2, h3, h4, h5, h6';

export function headingLevel(el: Element): number {
    return parseInt(el.tagName.slice(1), 10);
}

export interface OutlineHeading {
    element: HTMLElement;
    level: number;
    text: string;
    /** The level above it in the outline was skipped (e.g. an H4 right after an H2). */
    skipped: boolean;
}

/** The headings of the page in document order, as `heading-levels` sees them. */
export function headingOutline(doc: Document): OutlineHeading[] {
    let lastLevel = 0;
    return queryTargets<HTMLElement>(HEADINGS, doc).map((element) => {
        const level = headingLevel(element);
        const skipped = lastLevel !== 0 && level - lastLevel > 1;
        lastLevel = level;
        return { element, level, text: (element.textContent || '').trim().replace(/\s+/g, ' '), skipped };
    });
}
