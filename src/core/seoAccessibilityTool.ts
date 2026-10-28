import { prepareReactSources } from './reactSource';
import { rules, type Rule, type Report } from './rules';
import { cssSelector, issueIds, ruleHelp, type Issue } from '../sat/issue';
import type { RuleSetting, SATOptions } from '../sat/satOptions';

export type { SATOptions, RuleSetting, Engine } from '../sat/satOptions';
export type { Issue, Severity, Category } from '../sat/issue';
export type { RuleId, WcagLevel } from './rules';
export { fixPrompt, type FixPromptContext } from './fixPrompt';

export interface SATResult {
    issues: Issue[];
    errors: number;
    warnings: number;
}

/** `rules` wins over an engine that replaces the rule, then over the rule's default. */
function settingFor(rule: Rule, options: Partial<SATOptions>): RuleSetting | 'default' {
    const explicit = options.rules?.[rule.id];
    if (explicit) return explicit;

    if (options.engines?.some((engine) => engine.replaces.includes(rule.id))) return 'off';

    return rule.defaultOff ? 'off' : 'default';
}

/**
 * Runs the enabled SEO and accessibility rules on a document (the current page by default).
 * Each run has its own results, so runs on different documents can overlap. The page is never changed.
 *
 * @param customOptions - (Optional) Severity per rule and rule options.
 * @param doc - (Optional) The document to check.
 */
export async function seoAccessibilityTool(customOptions: Partial<SATOptions> = {}, doc: Document = document): Promise<SATResult> {
    const issues: Issue[] = [];

    for (const rule of rules) {
        const setting = settingFor(rule, customOptions);
        if (setting === 'off') continue;

        const report = ({ message, element, severity, wcag }: Report) => {
            issues.push({
                ruleId: rule.id,
                severity: setting === 'default' ? severity ?? rule.defaultSeverity : setting,
                category: rule.category,
                message,
                title: rule.title,
                wcag: wcag ?? rule.wcag,
                source: rule.source,
                element,
                selector: element && cssSelector(element),
                help: ruleHelp(rule.id),
            });
        };

        // A failing rule is reported but doesn't stop the others.
        try {
            await rule.run({ document: doc, allowedLinkTexts: customOptions.allowedLinkTexts ?? [], wcagLevel: customOptions.wcagLevel ?? 'AA', report });
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            issues.push({ ruleId: rule.id, severity: 'error', category: rule.category, message: `SAT internal error in ${rule.id}: ${detail}`, title: rule.title, help: ruleHelp(rule.id) });
        }
    }

    for (const engine of customOptions.engines ?? []) {
        try {
            (await engine.run(doc)).forEach((issue) => {
                const setting = customOptions.rules?.[issue.ruleId as keyof NonNullable<SATOptions['rules']>];
                if (setting === 'off') return;
                issues.push({
                    ...issue,
                    severity: setting ?? issue.severity,
                    selector: issue.element && cssSelector(issue.element),
                });
            });
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            issues.push({ ruleId: engine.name, severity: 'error', category: 'a11y', message: `SAT internal error in ${engine.name}: ${detail}` });
        }
    }

    // React 19 in development: the lines of the JSX for `componentSource`, before the prompt and the panel need them.
    await prepareReactSources(issues.map((issue) => issue.element));

    const count = (severity: Issue['severity']) => issues.filter((issue) => issue.severity === severity).length;
    return { issues, errors: count('error'), warnings: count('warning') };
}

/** An issue without its `element`: what `runSAT` returns, ready for `JSON.stringify`. */
export type IssueData = Omit<Issue, 'element'> & {
    /** Same issue, same id between runs: rule and selector (see `issueIds`). */
    id: string;
};

export interface SATReport {
    issues: IssueData[];
    summary: { errors: number; warnings: number };
}

/**
 * Same checks as `seoAccessibilityTool`, with a result that holds no DOM nodes, so it passes
 * through `JSON.stringify` and out of the page (Playwright, CI). Each issue keeps its `selector`.
 */
export async function runSAT(customOptions: Partial<SATOptions> = {}, doc: Document = document): Promise<SATReport> {
    const { issues, errors, warnings } = await seoAccessibilityTool(customOptions, doc);
    const ids = issueIds(issues);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = issues.map(({ element, ...issue }, index) => ({ id: ids[index], ...issue }));
    return { issues: data, summary: { errors, warnings } };
}
