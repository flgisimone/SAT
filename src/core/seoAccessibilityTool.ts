import {
    checkH1,
    checkH1Visible,
    checkHeadingOrder,
    checkJumpLevels
} from './improvedHeadingControl/improvedHeadingControl';

import { checkTextElementContrast } from './accessibilityA11y/colorContrastChecker';
import { checkAriaRolesWithSuggestions, checkUniqueLandmarks } from './accessibilityA11y/ariaRolesChecker';
import { checkAriaLabel } from "./accessibilityA11y/ariaLabelChecker";
import { checkInputLabels } from "./accessibilityA11y/inputLabelChecker";
import { checkFocusManagement } from "./accessibilityA11y/focusManagementChecker";
import { checkEmptyLinks } from "./improvedLinksControl/emptyLinksChecker";
import { checkTabindexNegativeOne } from "./improvedLinksControl/tabIndexNegativeOneChecker";

import { SATOptions, satOptions } from "../satOptions";
import { checkExternalLinksRel } from "./improvedLinksControl/externalLinksRelChecker";
import { checkNonDescriptiveLinks } from "./improvedLinksControl/nonDescriptiveLinksChecker";
import { checkBrokenInternalLinks } from "./improvedLinksControl/brokenInternalLinksChecker";

/**
 * Runs the Universal Accessibility Checker (A11y).
 *
 * @param enable - Enable or disable all accessibility checks globally.
 * @param customOptions - (Optional) Override default options for individual checks.
 */
export async function useSAT(enable: boolean, customOptions?: Partial<SATOptions>): Promise<void> {

    if (!enable || process.env.NODE_ENV === 'production') {
        console.warn('🚫 SAT checks are disabled or running in production.');

        return;
    }

    const options = { ...satOptions, ...customOptions };

    // Synchronous checks
    checkH1(options.enableCheckH1);
    checkH1Visible(options.enableCheckH1Visible);
    checkHeadingOrder(options.enableCheckHeadingOrder);
    checkJumpLevels(options.enableCheckJumpLevels);
    checkAriaLabel(options.enableCheckAriaLabel);
    checkAriaRolesWithSuggestions(options.enableCheckAriaRolesWithSuggestions);
    checkUniqueLandmarks(options.enableCheckUniqueLandmarks);
    checkTextElementContrast(options.enableCheckTextElementContrast);
    checkInputLabels(options.enableCheckInputLabel);
    checkFocusManagement(options.enableCheckFocusManagement);
    checkEmptyLinks(options.enableCheckEmptyLinks);
    checkExternalLinksRel(options.enableCheckExternalLinksRel)
    checkTabindexNegativeOne(options.enableCheckTabindexNegativeOne);
    checkNonDescriptiveLinks(
        options.enableCheckNonDescriptiveLinks,
        options.allowedLinkTexts
    );

    // Asynchronous check for broken internal links
    if (options.enableCheckBrokenInternalLinks) {
        try {
            await checkBrokenInternalLinks(true);
        } catch (error) {
            console.error('❌ Error during broken link checking:', error);
        }
    }

    console.log('🔍✅ [A11y] Accessibility checks completed.');
}
