import axeCore from 'axe-core';
import type { RuleId } from '../core/rules/rule';
import type { Issue } from '../sat/issue';
import { describeElement, SAT_IGNORE_SELECTOR } from '../sat/satDom';
import type { Engine } from '../sat/satOptions';

/**
 * SAT rules that axe-core checks too (and better): off while axe runs, so a problem is reported once.
 * The others (headings, link-href, link-text, tabindex-negative and the SEO rules) have no axe equivalent;
 * target-size stays on because axe's target-size rule is off by default.
 */
const REPLACED: RuleId[] = [
    'accessible-name', 'aria-roles', 'aria-attributes', 'aria-hidden-focus', 'landmarks', 'color-contrast', 'form-label',
    'focus-management', 'image-alt', 'html-lang', 'heading-levels', 'iframe-name', 'label-in-name', 'autocomplete-valid',
    'table-headers', 'meta-viewport', 'meta-refresh', 'media-autoplay',
];

/** axe tags such as "wcag143" or "wcag1410" → "1.4.3", "1.4.10". */
function wcagCriteria(tags: string[]): string[] {
    return tags.filter((tag) => /^wcag\d{3,}$/.test(tag)).map((tag) => `${tag[4]}.${tag[5]}.${tag.slice(6)}`);
}

function toIssues(results: axeCore.AxeResults): Array<Omit<Issue, 'selector'>> {
    return results.violations.flatMap((rule) => rule.nodes.map((node) => {
        const element = node.element;
        const impact = node.impact ?? rule.impact;
        const detail = [...node.any, ...node.all, ...node.none][0]?.message;
        const target = element ? describeElement(element) : node.html;
        return {
            ruleId: `axe/${rule.id}`,
            severity: impact === 'critical' || impact === 'serious' ? 'error' : 'warning',
            category: 'a11y',
            message: `${rule.help}: ${target}.${detail ? ` ${detail}` : ''}`,
            wcag: wcagCriteria(rule.tags),
            element,
            help: rule.helpUrl,
        };
    }));
}

/**
 * axe-core as a SAT engine: its violations become issues (`axe/<rule id>`, critical and serious
 * impact → error, moderate and minor → warning) and the SAT rules it covers are turned off.
 * Results axe can't decide ("incomplete") are not reported. Runs on the page's own document only.
 *
 * @param options - axe-core run options, e.g. `{ runOnly: ["wcag2a", "wcag2aa"] }`.
 */
export function axe(options: axeCore.RunOptions = {}): Engine {
    // axe throws if a run starts while another is going (e.g. a route change during a run): queue them.
    let queue: Promise<unknown> = Promise.resolve();

    return {
        name: 'axe',
        replaces: REPLACED,
        run(doc) {
            if (doc !== document) throw new Error('axe-core checks only the page it is loaded in.');
            const run = () => axeCore.run({ exclude: [[SAT_IGNORE_SELECTOR]] }, { ...options, elementRef: true, resultTypes: ['violations'] });
            const result = queue.then(run, run);
            queue = result;
            return result.then(toIssues);
        },
    };
}
