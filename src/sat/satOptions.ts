import type { RuleId, WcagLevel } from '../core/rules/rule';
import type { AIFixEndpoint } from './aiFix';
import type { Issue, Severity } from './issue';

/** A severity forces every issue of the rule to it; 'off' turns the rule off. */
export type RuleSetting = Severity | 'off';

/** 1.x options: `true` turns the rule on with its default severities, `false` turns it off. */
export interface LegacyOptions {
    /** @deprecated Use `rules: { 'h1': 'off' }`. */
    enableCheckH1?: boolean;
    /** @deprecated Use `rules: { 'h1-visible': 'off' }`. */
    enableCheckH1Visible?: boolean;
    /** @deprecated Use `rules: { 'heading-order': 'off' }`. */
    enableCheckHeadingOrder?: boolean;
    /** @deprecated Use `rules: { 'heading-levels': 'off' }`. */
    enableCheckJumpLevels?: boolean;
    /** @deprecated Use `rules: { 'color-contrast': 'off' }`. */
    enableCheckTextElementContrast?: boolean;
    /** @deprecated Use `rules: { 'accessible-name': 'off' }`. */
    enableCheckAriaLabel?: boolean;
    /** @deprecated Use `rules: { 'aria-roles': 'off' }`. */
    enableCheckAriaRolesWithSuggestions?: boolean;
    /** @deprecated Use `rules: { 'landmarks': 'off' }`. */
    enableCheckUniqueLandmarks?: boolean;
    /** @deprecated Use `rules: { 'form-label': 'off' }`. */
    enableCheckInputLabel?: boolean;
    /** @deprecated Use `rules: { 'focus-management': 'off' }`. */
    enableCheckFocusManagement?: boolean;
    /** @deprecated Use `rules: { 'image-alt': 'off' }`. */
    enableCheckImageAlt?: boolean;
    /** @deprecated Use `rules: { 'link-href': 'off' }`. */
    enableCheckEmptyLinks?: boolean;
    /** @deprecated Use `rules: { 'link-target-blank': 'off' }`. */
    enableCheckExternalLinksRel?: boolean;
    /** @deprecated Use `rules: { 'tabindex-negative': 'off' }`. */
    enableCheckTabindexNegativeOne?: boolean;
    /** @deprecated Use `rules: { 'link-text': 'warning' }`. */
    enableCheckNonDescriptiveLinks?: boolean;
    /** @deprecated Use `rules: { 'link-broken': 'error' }`. */
    enableCheckBrokenInternalLinks?: boolean;
    /** @deprecated Use `rules: { 'html-lang': 'off' }`. */
    enableCheckHtmlLang?: boolean;
    /** @deprecated Use `rules: { 'seo-meta': 'off' }`. */
    enableCheckSeoMeta?: boolean;
}

/** The rule each 1.x option controls. */
export const LEGACY_OPTIONS: Record<keyof LegacyOptions, RuleId> = {
    enableCheckH1: 'h1',
    enableCheckH1Visible: 'h1-visible',
    enableCheckHeadingOrder: 'heading-order',
    enableCheckJumpLevels: 'heading-levels',
    enableCheckTextElementContrast: 'color-contrast',
    enableCheckAriaLabel: 'accessible-name',
    enableCheckAriaRolesWithSuggestions: 'aria-roles',
    enableCheckUniqueLandmarks: 'landmarks',
    enableCheckInputLabel: 'form-label',
    enableCheckFocusManagement: 'focus-management',
    enableCheckImageAlt: 'image-alt',
    enableCheckEmptyLinks: 'link-href',
    enableCheckExternalLinksRel: 'link-target-blank',
    enableCheckTabindexNegativeOne: 'tabindex-negative',
    enableCheckNonDescriptiveLinks: 'link-text',
    enableCheckBrokenInternalLinks: 'link-broken',
    enableCheckHtmlLang: 'html-lang',
    enableCheckSeoMeta: 'seo-meta',
};

/**
 * Another checker whose issues join SAT's, e.g. axe-core through `seo-accessibility-tool/axe`.
 * Its rule ids carry its name as prefix (`axe/image-alt`), so `rules` can set them too.
 */
export interface Engine {
    name: string;
    /** SAT rules that check the same things: off while the engine is used, unless set in `rules`. */
    replaces: RuleId[];
    /** Issues without `selector`: SAT adds it. */
    run(doc: Document): Promise<Array<Omit<Issue, 'selector'>>>;
}

export interface SATOptions extends LegacyOptions {
    /**
     * Severity per rule, or 'off'. Takes precedence over the 1.x `enableCheck*` options.
     * Rules of an engine are named with its prefix, e.g. `"axe/region": "off"`.
     */
    rules?: Partial<Record<RuleId | `${string}/${string}`, RuleSetting>>;
    /** Other checkers to run with SAT's rules, e.g. `engines: [axe()]`. */
    engines?: Engine[];
    /** WCAG level to check: 'AA' (default) or 'AAA', which adds the AAA criteria as warnings (e.g. 1.4.6 contrast). */
    wcagLevel?: WcagLevel;
    /** Link texts `link-text` accepts anyway (case-insensitive). */
    allowedLinkTexts?: string[];
    /**
     * Controller only: `true` starts SAT without a bundler, `false` never starts it.
     * By default SAT starts when `process.env.NODE_ENV === "development"`.
     */
    enabled?: boolean;
    /**
     * Controller only: while SAT is on, runs the checks again this many milliseconds
     * after the page's DOM stops changing. Off by default; route changes always rerun them.
     */
    observeDom?: number;
    /** Controller only: the endpoint of "Fix with AI". Set by the Vite plugin with `ai: true`. */
    aiFix?: AIFixEndpoint;
}
