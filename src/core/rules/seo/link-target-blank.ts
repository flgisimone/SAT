import { queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/**
 * Links with target="_blank" and rel="opener", which give the opened page access to this one
 * through `window.opener`. Off by default: without rel="opener", HTML already implies noopener
 * for target="_blank" ("get an element's noopener").
 */
export const linkTargetBlank: Rule = {
    id: 'link-target-blank',
    category: 'seo',
    defaultSeverity: 'warning',
    defaultOff: true,
    run({ document, report }) {
        queryTargets<HTMLAnchorElement>('a[target="_blank" i][rel]', document).forEach((link) => {
            const rel = link.getAttribute('rel')!.toLowerCase().split(/\s+/);
            if (!rel.includes('opener')) return;

            report({
                element: link,
                message: `Link "${link.getAttribute('href') || '[no href]'}" with target="_blank" has rel="opener", so the opened page can control this one through window.opener. Remove "opener" unless that is intended.`,
            });
        });
    },
};
