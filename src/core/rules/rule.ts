import type { Category, Severity } from '../../sat/issue';

/** WCAG conformance level the checks aim at. */
export type WcagLevel = 'AA' | 'AAA';

export type RuleId =
    | 'h1'
    | 'h1-visible'
    | 'heading-order'
    | 'heading-levels'
    | 'accessible-name'
    | 'aria-roles'
    | 'aria-attributes'
    | 'aria-hidden-focus'
    | 'landmarks'
    | 'color-contrast'
    | 'form-label'
    | 'focus-management'
    | 'image-alt'
    | 'link-href'
    | 'link-target-blank'
    | 'tabindex-negative'
    | 'link-text'
    | 'html-lang'
    | 'iframe-name'
    | 'label-in-name'
    | 'target-size'
    | 'autocomplete-valid'
    | 'table-headers'
    | 'meta-viewport'
    | 'meta-refresh'
    | 'media-autoplay'
    | 'seo-meta'
    | 'canonical'
    | 'robots-meta'
    | 'social-meta'
    | 'hreflang'
    | 'structured-data'
    | 'mixed-content'
    | 'image-size'
    | 'image-lazy-load';

/** What a rule passes to `ctx.report`. */
export interface Report {
    message: string;
    element?: Element;
    /** Defaults to the rule's `defaultSeverity`. */
    severity?: Severity;
    /** Defaults to the rule's `wcag`. */
    wcag?: string[];
}

/** Created for every run: rules keep no state between runs. */
export interface RuleContext {
    document: Document;
    allowedLinkTexts: string[];
    wcagLevel: WcagLevel;
    report(report: Report): void;
}

export interface Rule {
    id: RuleId;
    /** Short readable name, shown in the panel. */
    title: string;
    /** Short name of the source, for rules without a WCAG criterion (e.g. "Google"). */
    source?: string;
    category: Category;
    defaultSeverity: Severity;
    /** True for rules that must be turned on explicitly. */
    defaultOff?: boolean;
    wcag?: string[];
    run(ctx: RuleContext): void | Promise<void>;
}
