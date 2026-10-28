import type { RuleId, WcagLevel } from '../core/rules/rule';
import type { AIFixEndpoint } from './aiFix';
import type { Issue, Severity } from './issue';
import type { MCPEndpoint } from './mcpResults';

/** A severity forces every issue of the rule to it; 'off' turns the rule off. */
export type RuleSetting = Severity | 'off';

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

export interface SATOptions {
    /**
     * Severity per rule, or 'off'.
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
    /** Controller only: where the results go for the agents that use SAT's MCP server. Set by the Vite plugin with `mcp: true`. */
    mcp?: MCPEndpoint;
    /** Controller only: shows once a hint to turn on the plugin's `mcp`. Set by the Vite plugin without `mcp` and `ai`. */
    suggestMcp?: boolean;
}
