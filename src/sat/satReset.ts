import { clearHighlights } from './satDom';

/**
 * Removes SAT highlights and restores each element's original inline styles and title.
 */
export function satReset(): void {
    clearHighlights();
}
