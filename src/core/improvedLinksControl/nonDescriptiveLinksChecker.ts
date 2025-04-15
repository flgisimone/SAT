import {logWarning} from "../../sat/satLogger";

/**
 * Checks if <a> links have descriptive text.
 * Warns if the link text is too short or non-descriptive, unless allowed by options.
 *
 * @param {boolean} enabled - Enable or disable this check.
 * @param {string[]} [allowedTexts=[]] - List of allowed link texts to skip validation.
 */
export function checkNonDescriptiveLinks(
    enabled: boolean,
    allowedTexts: string[] = []
): void {
    if (!enabled) return;

    const links = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[];

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

    links.forEach((link) => {
        const rawText = link.textContent?.trim() || '';
        const text = rawText.toLowerCase();

        const isAllowed = allowedTexts.includes(text);
        const isTooShort = text.length < 4;
        const isNonDescriptive = NON_DESCRIPTIVE_LINK_TEXTS.includes(text);

        if ((isTooShort || isNonDescriptive) && !isAllowed) {
            const msg = `Non-descriptive link text found: "${rawText}" in <a href="${link.href}">`;
            logWarning(msg);

            link.style.outline = '2px dashed orange';
            link.title = '⚠️ Non-descriptive link text';
        }
    });
}
