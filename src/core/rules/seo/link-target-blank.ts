import { queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/** Links with target="_blank" have rel="noopener noreferrer". */
export const linkTargetBlank: Rule = {
    id: 'link-target-blank',
    category: 'seo',
    defaultSeverity: 'warning',
    run({ document, report }) {

        queryTargets<HTMLAnchorElement>('a[target="_blank"]', document).forEach((link) => {
            const rel = (link.getAttribute('rel') || '').toLowerCase().split(/\s+/);
            if (rel.includes('noopener') && rel.includes('noreferrer')) return;

            report({
                element: link,
                message: `Link "${link.getAttribute('href') || '[no href]'}" with target="_blank" is missing rel="noopener noreferrer".`,
                highlight: { outline: '2px dashed black', title: 'Missing rel="noopener noreferrer"' },
            });
        });
    },
};
