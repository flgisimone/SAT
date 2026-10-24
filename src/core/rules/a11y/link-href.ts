import { describeElement, isHiddenFromAssistiveTech, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/**
 * <a> elements that don't point anywhere (WCAG 2.1.1, 4.1.2): href="", href="#" or
 * href="javascript:…" (an action disguised as a link). Framework click handlers (React onClick,
 * Vue @click) aren't visible in the DOM, so the suggestion is to use a <button> for actions.
 *
 * <a> without href is a placeholder link, valid HTML, and is not reported.
 * Links hidden from assistive technologies (e.g. a closed menu) can't be reached and are skipped.
 */
export const linkHref: Rule = {
    id: 'link-href',
    title: 'Links have a usable href',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['2.1.1'],
    run({ document, report }) {

        queryTargets<HTMLAnchorElement>('a', document).forEach((link) => {
            if (isHiddenFromAssistiveTech(link)) return;
            const href = link.getAttribute('href');

            if (href === null) return;

            const value = href.trim();
            if (value === '' || value === '#' || /^javascript:/i.test(value)) {
                const message = `${describeElement(link)} has href="${href}", which doesn't lead anywhere. Use a real URL, or a <button> for actions.`;
                report({ element: link, message });
            }
        });
    },
};
