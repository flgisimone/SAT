import { logWarning } from "../../sat/satLogger";
import { getAccessibleName, highlight, queryTargets } from "../../sat/satDom";

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
 * Checks if <a> links have descriptive text.
 * Warns if the link's accessible name is too short or generic, unless allowed by options.
 * Links with no name at all are reported by `checkAriaLabel`.
 *
 * @param {boolean} enabled - Enable or disable this check.
 * @param {string[]} [allowedTexts=[]] - Link texts to skip (case-insensitive).
 */
export function checkNonDescriptiveLinks(
    enabled: boolean,
    allowedTexts: string[] = []
): void {
    if (!enabled) return;

    const allowed = allowedTexts.map((t) => t.trim().toLowerCase());

    queryTargets<HTMLAnchorElement>('a[href]').forEach((link) => {
        const rawText = getAccessibleName(link);
        const text = rawText.toLowerCase();
        if (!text || allowed.includes(text)) return;

        const isTooShort = text.length < 4;
        const isNonDescriptive = NON_DESCRIPTIVE_LINK_TEXTS.includes(text);

        if (isTooShort || isNonDescriptive) {
            logWarning(`Non-descriptive link text: "${rawText}" in <a href="${link.getAttribute('href')}">.`);
            highlight(link, { outline: '2px dashed orange', title: '⚠️ Non-descriptive link text' });
        }
    });
}
