import { rules, type Rule, type Report } from './rules';
import { cssSelector, ruleHelp, type Issue } from '../sat/issue';
import { LEGACY_OPTIONS, type LegacyOptions, type RuleSetting, type SATOptions } from '../sat/satOptions';

export type { SATOptions, RuleSetting, Engine } from '../sat/satOptions';
export type { Issue, Severity, Category } from '../sat/issue';
export type { RuleId, WcagLevel } from './rules';
export { satReset } from '../sat/satReset';

export interface SATResult {
    issues: Issue[];
    errors: number;
    warnings: number;
    /** @deprecated Use `issues`. */
    errorMessages: string[];
    /** @deprecated Use `issues`. */
    warningMessages: string[];
}

/** `rules` wins over the 1.x `enableCheck*` option, then over an engine that replaces the rule, then over the rule's default. */
function settingFor(rule: Rule, options: Partial<SATOptions>): RuleSetting | 'default' {
    const explicit = options.rules?.[rule.id];
    if (explicit) return explicit;

    const legacyKey = (Object.keys(LEGACY_OPTIONS) as Array<keyof LegacyOptions>).find((key) => LEGACY_OPTIONS[key] === rule.id);
    const legacy = legacyKey && options[legacyKey];
    if (legacy !== undefined) return legacy ? 'default' : 'off';

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
                wcag: wcag ?? rule.wcag,
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
            issues.push({ ruleId: rule.id, severity: 'error', category: rule.category, message: `SAT internal error in ${rule.id}: ${detail}`, help: ruleHelp(rule.id) });
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

    const messagesOf = (severity: Issue['severity']) => issues.filter((issue) => issue.severity === severity).map((issue) => issue.message);
    const errorMessages = messagesOf('error');
    const warningMessages = messagesOf('warning');

    return { issues, errors: errorMessages.length, warnings: warningMessages.length, errorMessages, warningMessages };
}

/** An issue without its `element`: what `runSAT` returns, ready for `JSON.stringify`. */
export type IssueData = Omit<Issue, 'element'>;

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = issues.map(({ element, ...issue }) => issue);
    return { issues: data, summary: { errors, warnings } };
}
