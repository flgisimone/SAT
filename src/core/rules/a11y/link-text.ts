import { getAccessibleName, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

const NON_DESCRIPTIVE_LINK_TEXTS = [
    'click here',
    'here',
    'read more',
    'more',
    'learn more',
    'discover',
    'see more',
    'details',
    'info',
    'link'
];

/**
 * Link text describes the destination (WCAG 2.4.4). Off by default.
 * Warns if the link's accessible name is too short or generic, unless listed in `allowedLinkTexts`.
 * Links with no name at all are reported by `accessible-name`.
 */
export const linkText: Rule = {
    id: 'link-text',
    category: 'a11y',
    defaultSeverity: 'warning',
    defaultOff: true,
    wcag: ['2.4.4'],
    run({ document, report, allowedLinkTexts }) {
        const allowed = allowedLinkTexts.map((text) => text.trim().toLowerCase());

        queryTargets<HTMLAnchorElement>('a[href]', document).forEach((link) => {
            const rawText = getAccessibleName(link);
            const text = rawText.toLowerCase();
            if (!text || allowed.includes(text)) return;

            if (text.length < 4 || NON_DESCRIPTIVE_LINK_TEXTS.includes(text)) {
                report({
                    element: link,
                    message: `Non-descriptive link text: "${rawText}" in <a href="${link.getAttribute('href')}">.`,
                });
            }
        });
    },
};
