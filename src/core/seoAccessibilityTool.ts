import {
    checkH1,
    checkH1Visible,
    checkHeadingOrder,
    checkJumpLevels
} from './improvedHeadingControl/improvedHeadingControl';
import {checkTextElementContrast} from "./accessibilityA11y/colorContrastChecker";
import ariaLabelChecker from "./accessibilityA11y/ariaLabelChecker";
import {checkAriaRolesWithSuggestions, checkUniqueLandmarks} from "./accessibilityA11y/ariaRolesChecker";

/**
 * Runs the Universal Accessibility Checker (A11y).
 *
 * This function aggregates multiple accessibility validation checks into a single call.
 * It helps developers quickly identify and resolve common accessibility issues following
 * WCAG 2.1 and WAI-ARIA best practices.
 *
 * ✅ Checks Included:
 *
 * 1. **Heading Structure**
 *    - `checkH1()` ➔ Ensures exactly one `<h1>` exists (not missing or duplicated).
 *    - `checkH1Visible()` ➔ Ensures the `<h1>` is visible in the viewport.
 *    - `checkHeadingOrder()` ➔ Validates sequential heading order (`<h1>` ➔ `<h6>`).
 *    - `checkJumpLevels()` ➔ Detects heading level jumps and regressions.
 *
 * 2. **Color Contrast**
 *    - `checkTextElementContrast()` ➔ Validates text contrast against background colors
 *      according to WCAG 2.1 AA/AAA requirements.
 *
 * 3. **ARIA Label Checks**
 *    - `ariaLabelChecker()` ➔ Ensures essential elements (`button`, `a`, `nav`, etc.) have
 *      appropriate `aria-label` or `aria-labelledby` attributes.
 *
 * 4. **ARIA Roles**
 *    - `checkAriaRolesWithSuggestions()` ➔ Validates ARIA `role` attributes for correctness
 *      and provides suggestions based on semantic elements.
 *
 * 5. **Landmark Uniqueness**
 *    - `checkUniqueLandmarks()` ➔ Verifies that landmark elements (`header`, `nav`, `main`, `footer`)
 *      are unique or properly labeled when repeated.
 *
 * @returns {void}
 */
export function useSAT(): void {
    checkH1();
    checkH1Visible();
    checkHeadingOrder();
    checkJumpLevels();
    checkTextElementContrast();
    ariaLabelChecker();
    checkAriaRolesWithSuggestions();
    checkUniqueLandmarks();
}
