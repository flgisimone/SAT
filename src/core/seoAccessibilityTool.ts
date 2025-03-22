import {
    checkH1,
    checkH1Visible,
    checkHeadingOrder,
    checkJumpLevels
} from './improvedHeadingControl/improvedHeadingControl';

import { checkTextElementContrast } from './accessibilityA11y/colorContrastChecker';
import { checkAriaRolesWithSuggestions, checkUniqueLandmarks } from './accessibilityA11y/ariaRolesChecker';
import { checkAriaLabel}  from "./accessibilityA11y/ariaLabelChecker";
import { checkInputLabels } from "./accessibilityA11y/inputLabelChecker";
import { checkFocusManagement } from "./accessibilityA11y/focusManagementChecker";
import {checkEmptyLinks} from "./improvedLinksControl/emptyLinksChecker";


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
 * 2. **Color Contrast**
 * 3. **ARIA Label Checks**
 * 4. **ARIA Roles**
 * 5. **Landmark Uniqueness**
 *
 * @param enable - Enable or disable the accessibility checks.
 * @returns {void}
 */

export function useSAT(enable: boolean): void {
    if (process.env.NODE_ENV !== 'production' && enable) {

        checkH1();
        checkH1Visible();
        checkHeadingOrder();
        checkJumpLevels();
        checkTextElementContrast();
        checkAriaLabel();
        checkAriaRolesWithSuggestions();
        checkUniqueLandmarks();
        checkInputLabels();
        checkFocusManagement();
        checkEmptyLinks();

        console.log('🔍✅ [A11y] Accessibility checks completed.');
    }
}
