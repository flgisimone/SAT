import {
    checkH1,
    checkH1Visible,
    checkHeadingOrder,
    checkJumpLevels
} from './improvedHeadingControl/improvedHeadingControl';
import {checkTextElementContrast} from "./accessibilityA11y/colorContrastChecker";
import ariaLabelChecker from "./accessibilityA11y/ariaLabelChecker";

/**
 * Runs the Universal Accessibility Checker (A11y)
 * Runs heading checks, contrast validation, ARIA label checks.
 */
export function useSAT(): void {
    checkH1();
    checkH1Visible();
    checkHeadingOrder();
    checkJumpLevels();
    checkTextElementContrast();
    ariaLabelChecker()
}
