import { queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/** Robots meta names that apply to every crawler or to Google's. */
const ROBOTS_META = 'meta[name="robots" i], meta[name="googlebot" i]';

/**
 * `noindex`, `nofollow` or `none` in a robots meta tag (Google Search Central, robots meta tag).
 * Always a warning: blocking indexing is right on staging or private pages, and a mistake on public ones.
 */
export const robotsMeta: Rule = {
    id: 'robots-meta',
    category: 'seo',
    defaultSeverity: 'warning',
    run({ document, report }) {

        queryTargets<HTMLMetaElement>(ROBOTS_META, document).forEach((meta) => {
            const directives = (meta.getAttribute('content') ?? '').toLowerCase().split(',').map((d) => d.trim());
            const name = meta.getAttribute('name')!.toLowerCase();

            if (directives.includes('noindex') || directives.includes('none')) {
                report({ element: meta, message: `<meta name="${name}"> has noindex: search engines won't show this page.` });
            }
            if (directives.includes('nofollow') || directives.includes('none')) {
                report({ element: meta, message: `<meta name="${name}"> has nofollow: search engines won't follow the links of this page.` });
            }
        });
    },
};
