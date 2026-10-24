import type { HighlightStyle } from "../../sat/satDom";

export const HEADINGS = 'h1, h2, h3, h4, h5, h6';

/** One color per heading level: together they draw the outline of the page. */
export const LEVEL_STYLES: Record<number, HighlightStyle> = {
    1: { backgroundColor: 'rgba(255, 0, 0, 0.1)', outline: '2px solid red' },
    2: { backgroundColor: 'rgba(255, 165, 0, 0.1)', outline: '2px solid orange' },
    3: { backgroundColor: 'rgba(255, 255, 0, 0.1)', outline: '2px solid yellow' },
    4: { backgroundColor: 'rgba(0, 128, 0, 0.1)', outline: '2px solid green' },
    5: { backgroundColor: 'rgba(0, 0, 255, 0.1)', outline: '2px solid blue' },
    6: { backgroundColor: 'rgba(128, 0, 128, 0.1)', outline: '2px solid purple' },
};

export function headingLevel(el: Element): number {
    return parseInt(el.tagName.slice(1), 10);
}
