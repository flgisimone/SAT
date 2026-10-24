import { describeElement, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/**
 * <a> elements that don't point anywhere (WCAG 2.1.1, 4.1.2).
 * - Error: href="", href="#" or href="javascript:…" (an action disguised as a link).
 * - Warning: <a> without href, which is not keyboard-focusable.
 *
 * Framework click handlers (React onClick, Vue @click) aren't visible in the DOM,
 * so in both cases the suggestion is to use a <button> for actions.
 */
export const linkHref: Rule = {
    id: 'link-href',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['2.1.1'],
    run({ document, report }) {

        queryTargets<HTMLAnchorElement>('a', document).forEach((link) => {
            const href = link.getAttribute('href');

            if (href === null) {
                if (link.hasAttribute('name')) return; // legacy in-page anchor target
                const message = `${describeElement(link)} has no href, so keyboard users can't reach it. If it triggers an action, use a <button>.`;
                report({ element: link, message, severity: 'warning', highlight: { outline: '2px dashed orange', title: message } });
                return;
            }

            const value = href.trim();
            if (value === '' || value === '#' || /^javascript:/i.test(value)) {
                const message = `${describeElement(link)} has href="${href}", which doesn't lead anywhere. Use a real URL, or a <button> for actions.`;
                report({ element: link, message, highlight: { outline: '2px dashed brown', title: message } });
            }
        });
    },
};
