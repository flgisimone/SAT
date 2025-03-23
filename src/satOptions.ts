import {checkExternalLinksRel} from "./core/improvedLinksControl/externalLinksRelChecker";

export interface SATOptions {
    enableCheckH1: boolean;
    enableCheckH1Visible: boolean;
    enableCheckHeadingOrder: boolean;
    enableCheckJumpLevels: boolean;
    enableCheckTextElementContrast: boolean;
    enableCheckAriaLabel: boolean;
    enableCheckAriaRolesWithSuggestions: boolean;
    enableCheckUniqueLandmarks: boolean;
    enableCheckInputLabel: boolean;
    enableCheckFocusManagement: boolean;
    enableCheckEmptyLinks: boolean;
    enableCheckExternalLinksRel: boolean;
    enableCheckTabindexNegativeOne: boolean;
}

export const satOptions: SATOptions = {
    enableCheckH1: true,
    enableCheckH1Visible: true,
    enableCheckHeadingOrder: true,
    enableCheckJumpLevels: true,
    enableCheckTextElementContrast: true,
    enableCheckAriaLabel: true,
    enableCheckAriaRolesWithSuggestions: true,
    enableCheckUniqueLandmarks: true,
    enableCheckInputLabel: true,
    enableCheckFocusManagement: true,
    enableCheckEmptyLinks: true,
    enableCheckExternalLinksRel: true,
    enableCheckTabindexNegativeOne: true
}
