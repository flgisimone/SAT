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
    enableCheckNonDescriptiveLinks: boolean;
    allowedLinkTexts: string[];
    enableCheckBrokenInternalLinks: boolean,
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
    enableCheckTabindexNegativeOne: true,
    enableCheckNonDescriptiveLinks: false,
    allowedLinkTexts: [],
    enableCheckBrokenInternalLinks: true,
}
