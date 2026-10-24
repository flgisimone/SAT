import { logError, logWarning } from "../../sat/satLogger";
import { describeElement, highlight, queryTargets } from "../../sat/satDom";

/**
 * Checks <a> elements that don't point anywhere.
 * - Error: href="", href="#" or href="javascript:…" (an action disguised as a link).
 * - Warning: <a> without href, which is not keyboard-focusable.
 *
 * Framework click handlers (React onClick, Vue @click) aren't visible in the DOM,
 * so in both cases the suggestion is to use a <button> for actions.
 */
export function checkEmptyLinks(enableCheckEmptyLinks?: boolean): void {
    if (!enableCheckEmptyLinks) return;

    queryTargets<HTMLAnchorElement>('a').forEach((link) => {
        const href = link.getAttribute('href');

        if (href === null) {
            if (link.hasAttribute('name')) return; // legacy in-page anchor target
            const msg = `${describeElement(link)} has no href, so keyboard users can't reach it. If it triggers an action, use a <button>.`;
            logWarning(msg);
            highlight(link, { outline: '2px dashed orange', title: msg });
            return;
        }

        const value = href.trim();
        if (value === '' || value === '#' || /^javascript:/i.test(value)) {
            const msg = `${describeElement(link)} has href="${href}", which doesn't lead anywhere. Use a real URL, or a <button> for actions.`;
            logError(msg);
            highlight(link, { outline: '2px dashed brown', title: msg });
        }
    });
}
