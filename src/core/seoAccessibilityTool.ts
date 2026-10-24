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
import { checkImageAlt } from "./accessibilityA11y/imageAltChecker";

import { checkEmptyLinks } from "./improvedLinksControl/emptyLinksChecker";
import { checkTabindexNegativeOne } from "./improvedLinksControl/tabIndexNegativeOneChecker";
import { checkExternalLinksRel } from "./improvedLinksControl/externalLinksRelChecker";
import { checkNonDescriptiveLinks } from "./improvedLinksControl/nonDescriptiveLinksChecker";
import { checkBrokenInternalLinks } from "./improvedLinksControl/brokenInternalLinksChecker";

import { checkHtmlLang, checkSeoMeta } from "./seo/seoMetaChecker";

import { resetSatLogStats, getSatLogStats, logError } from "../sat/satLogger";
import { satOptions, SATOptions } from "../sat/satOptions";

export type { SATOptions } from "../sat/satOptions";

export interface SATResult {
    errors: number;
    warnings: number;
    errorMessages: string[];
    warningMessages: string[];
}

/**
 * Runs all enabled SEO and accessibility checks on the current page.
 *
 * @param customOptions - (Optional) Override default options for individual checks.
 */
export async function seoAccessibilityTool(customOptions?: Partial<SATOptions>): Promise<SATResult> {
    const options = { ...satOptions, ...customOptions };

    resetSatLogStats();

    const syncChecks: Array<[string, () => void]> = [
        ['checkH1', () => checkH1(options.enableCheckH1)],
        ['checkH1Visible', () => checkH1Visible(options.enableCheckH1Visible)],
        ['checkHeadingOrder', () => checkHeadingOrder(options.enableCheckHeadingOrder)],
        ['checkJumpLevels', () => checkJumpLevels(options.enableCheckJumpLevels)],
        ['checkAriaLabel', () => checkAriaLabel(options.enableCheckAriaLabel)],
        ['checkAriaRoles', () => checkAriaRolesWithSuggestions(options.enableCheckAriaRolesWithSuggestions)],
        ['checkUniqueLandmarks', () => checkUniqueLandmarks(options.enableCheckUniqueLandmarks)],
        ['checkTextElementContrast', () => checkTextElementContrast(options.enableCheckTextElementContrast)],
        ['checkInputLabels', () => checkInputLabels(options.enableCheckInputLabel)],
        ['checkFocusManagement', () => checkFocusManagement(options.enableCheckFocusManagement)],
        ['checkImageAlt', () => checkImageAlt(options.enableCheckImageAlt)],
        ['checkEmptyLinks', () => checkEmptyLinks(options.enableCheckEmptyLinks)],
        ['checkExternalLinksRel', () => checkExternalLinksRel(options.enableCheckExternalLinksRel)],
        ['checkTabindexNegativeOne', () => checkTabindexNegativeOne(options.enableCheckTabindexNegativeOne)],
        ['checkNonDescriptiveLinks', () => checkNonDescriptiveLinks(options.enableCheckNonDescriptiveLinks, options.allowedLinkTexts)],
        ['checkHtmlLang', () => checkHtmlLang(options.enableCheckHtmlLang)],
        ['checkSeoMeta', () => checkSeoMeta(options.enableCheckSeoMeta)],
    ];

    // A failing check is reported but doesn't stop the others.
    for (const [name, run] of syncChecks) {
        try {
            run();
        } catch (error) {
            logError(`SAT internal error in ${name}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    if (options.enableCheckBrokenInternalLinks) {
        try {
            await checkBrokenInternalLinks(true);
        } catch (error) {
            logError(`SAT internal error in checkBrokenInternalLinks: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    return getSatLogStats();
}
