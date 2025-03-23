/**
 * Checks if <a> links have descriptive text.
 * Warns if the link text is too short or non-descriptive, unless allowed by options.
 *
 * @param {boolean} enabled - Enable or disable this check.
 * @param {string[]} [allowedTexts=[]] - List of allowed link texts to skip validation.
 * @returns {void}
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

    let totalIssues = 0;

    links.forEach((link, index) => {
        const text = link.textContent?.trim().toLowerCase() || '';
        const href = link.getAttribute('href') || '[no href]';

        const isAllowed = allowedTexts.map(t => t.toLowerCase()).includes(text);
        const isTooShort = text.length < 4;
        const isNonDescriptive = NON_DESCRIPTIVE_LINK_TEXTS.includes(text);

        if ((isTooShort || isNonDescriptive) && !isAllowed) {
            totalIssues++;

            console.error(
                `❌ [${index + 1}] Non-descriptive link text found: "${link.textContent?.trim()}" in <a href="${href}">`
            );

            link.title = '⚠️ Non-descriptive link text';
        }
    });

    if (totalIssues === 0) {
        console.log('✅ All <a> links have descriptive text.');
    } else {
        console.warn(`⚠️ Found ${totalIssues} <a> links with non-descriptive or too short text. Review the warnings above.`);
    }
}
