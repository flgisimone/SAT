import {improvedHeadingControl} from "./improvedHeadingControl /improvedHeadingControl";
import {accessibilityA11y} from "./accessibilityA11y/accessibilityA11y";

/**
 * Runs the complete SEO Accessibility Tool (SAT) checks:
 * - Checks heading order (`<h1>` to `<h6>`) for hierarchy issues.
 * - Checks the presence of `<h1>` tags (multiple or missing).
 * - Checks if the `<h1>` is visible in the viewport.
 *
 * @returns {void}
 */
export function useSAT(): void {
    improvedHeadingControl();
    accessibilityA11y()
}
