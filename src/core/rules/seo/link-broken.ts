import { queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

const MAX_CONCURRENT_REQUESTS = 5;

/** Links that may change state on the server when requested, and so are never fetched. */
const UNSAFE_PATH = /(log-?out|sign-?out|logoff|delete|remove|unsubscribe)/i;

/**
 * Returns the same-origin URLs linked from the page, grouped by URL (fragment removed).
 * Protocol-relative links (//host/...) and other origins are excluded.
 */
export function collectInternalLinks(doc: Document = document): Map<string, HTMLAnchorElement[]> {
    // A document created by script has no location: it is resolved against the page.
    const location = doc.location ?? window.location;
    const byUrl = new Map<string, HTMLAnchorElement[]>();

    queryTargets<HTMLAnchorElement>('a[href]', doc).forEach((link) => {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#') || /^(mailto|tel|javascript|data):/i.test(href)) return;

        let url: URL;
        try {
            url = new URL(href, location.href);
        } catch {
            return;
        }
        if (url.origin !== location.origin || UNSAFE_PATH.test(url.pathname)) return;

        url.hash = '';
        const key = url.toString();
        const group = byUrl.get(key) || [];
        group.push(link);
        byUrl.set(key, group);
    });

    return byUrl;
}

/**
 * Internal links answer without 4xx/5xx, checked with HEAD requests. Off by default.
 * Each URL is requested once, at most 5 at a time. Logout/delete-like URLs are skipped.
 *
 * Note: in single-page apps the dev server usually answers 200 for any route,
 * so client-side 404s can't be detected this way.
 */
export const linkBroken: Rule = {
    id: 'link-broken',
    category: 'seo',
    defaultSeverity: 'error',
    defaultOff: true,
    async run({ document, report }) {
        const queue = Array.from(collectInternalLinks(document).entries());

        const markBroken = (url: string, links: HTMLAnchorElement[], reason: string) => {
            report({ element: links[0], message: `Broken internal link: ${url} (${reason}), used by ${links.length} link(s).` });
        };

        const worker = async () => {
            for (let next = queue.shift(); next; next = queue.shift()) {
                const [url, links] = next;
                try {
                    const response = await fetch(url, { method: 'HEAD', credentials: 'same-origin' });
                    if (!response.ok) markBroken(url, links, `status ${response.status}`);
                } catch {
                    markBroken(url, links, 'request failed');
                }
            }
        };

        await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT_REQUESTS, queue.length) }, worker));
    },
};
