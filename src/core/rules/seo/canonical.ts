import { describeElement, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/** True for an absolute http(s) URL; relative URLs depend on the page they are read from. */
export function isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value.trim());
}

/**
 * The canonical URL (Google Search Central, "Consolidate duplicate URLs"):
 * - error: more than one `<link rel="canonical">` (search engines ignore them all) or an empty href;
 * - warning: no canonical, or a relative one (allowed, but easy to get wrong).
 *
 * A canonical pointing to another host is valid (cross-domain canonical) and is not reported:
 * in development the page runs on localhost while the canonical names the production host.
 */
export const canonical: Rule = {
    id: 'canonical',
    category: 'seo',
    defaultSeverity: 'warning',
    run({ document, report }) {

        const links = queryTargets<HTMLLinkElement>('link[rel~="canonical" i]', document);
        if (links.length === 0) {
            report({ message: 'Missing <link rel="canonical">. Add one with the absolute URL of the page.' });
            return;
        }
        if (links.length > 1) {
            report({
                element: links[1],
                message: `${links.length} <link rel="canonical"> found; search engines ignore them all. Keep only one.`,
                severity: 'error',
            });
            return;
        }

        const href = links[0].getAttribute('href')?.trim() ?? '';
        if (!href) {
            report({ element: links[0], message: `${describeElement(links[0])} has an empty href.`, severity: 'error' });
        } else if (!isAbsoluteUrl(href)) {
            report({ element: links[0], message: `Canonical URL "${href}" is relative. Use an absolute URL (https://…).` });
        }
    },
};
