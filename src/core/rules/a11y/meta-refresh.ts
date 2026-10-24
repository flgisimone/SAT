import { queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/** 20 hours: longer delays fall under the 20-hour exception of WCAG 2.2.1. */
const MAX_DELAY = 72_000;

/** Delay in seconds of a refresh content value (HTML "shared declarative refresh steps"), or null if it is not valid. */
function refreshDelay(content: string): number | null {
    const match = /^[\t\n\f\r ]*(\d+)[\d.]*(?=$|[\t\n\f\r ;,])/.exec(content);
    return match ? Number(match[1]) : null;
}

/**
 * No timed refresh or redirect (ACT bc659a, WCAG 2.2.1; 3.2.5 at level AAA): the page changes before
 * users can finish reading it. Only the first valid refresh counts, as in browsers; a delay of 0
 * (an immediate redirect) and delays over 20 hours are fine.
 */
export const metaRefresh: Rule = {
    id: 'meta-refresh',
    title: 'Page does not refresh by itself',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['2.2.1'],
    run({ document, report, wcagLevel }) {
        const first = queryTargets<HTMLMetaElement>('meta[http-equiv="refresh" i][content]', document)
            .map((meta) => ({ meta, delay: refreshDelay(meta.getAttribute('content')!) }))
            .find(({ delay }) => delay !== null);
        if (!first || first.delay === 0 || first.delay! > MAX_DELAY) return;

        report({
            element: first.meta,
            message: `<meta http-equiv="refresh" content="${first.meta.getAttribute('content')}"> reloads or redirects the page after ${first.delay} s. Redirect on the server (or with a delay of 0), or let users choose when to refresh.`,
            wcag: wcagLevel === 'AAA' ? ['2.2.1', '3.2.5'] : ['2.2.1'],
        });
    },
};
