import { logError } from "../../sat/satLogger";
import { highlight, queryTargets } from "../../sat/satDom";

const MAX_CONCURRENT_REQUESTS = 5;

/** Links that may change state on the server when requested, and so are never fetched. */
const UNSAFE_PATH = /(log-?out|sign-?out|logoff|delete|remove|unsubscribe)/i;

/**
 * Returns the same-origin URLs linked from the page, grouped by URL (fragment removed).
 * Protocol-relative links (//host/...) and other origins are excluded.
 */
export function collectInternalLinks(): Map<string, HTMLAnchorElement[]> {
    const origin = window.location.origin;
    const byUrl = new Map<string, HTMLAnchorElement[]>();

    queryTargets<HTMLAnchorElement>('a[href]').forEach((link) => {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#') || /^(mailto|tel|javascript|data):/i.test(href)) return;

        let url: URL;
        try {
            url = new URL(href, window.location.href);
        } catch {
            return;
        }
        if (url.origin !== origin || UNSAFE_PATH.test(url.pathname)) return;

        url.hash = '';
        const key = url.toString();
        const group = byUrl.get(key) || [];
        group.push(link);
        byUrl.set(key, group);
    });

    return byUrl;
}

/**
 * Checks internal links with HEAD requests and reports 4xx/5xx responses.
 * Each URL is requested once, at most 5 at a time. Logout/delete-like URLs are skipped.
 *
 * Note: in single-page apps the dev server usually answers 200 for any route,
 * so client-side 404s can't be detected this way.
 */
export async function checkBrokenInternalLinks(enable: boolean): Promise<void> {
    if (!enable) return;

    const byUrl = collectInternalLinks();
    const queue = Array.from(byUrl.entries());

    const markBroken = (url: string, links: HTMLAnchorElement[], reason: string) => {
        logError(`Broken internal link: ${url} (${reason}), used by ${links.length} link(s).`);
        links.forEach((link) => highlight(link, { outline: '2px solid red', title: `Broken link (${reason})` }));
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
}
