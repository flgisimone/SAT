/**
 * Checks all external links (<a> tags with target="_blank") for missing rel="noopener noreferrer".
 * Logs a warning if unsafe links are found.
 *
 * @param enableCheckExternalLinksRel - Enable/disable this checker
 * @returns {void}
 */
export function checkExternalLinksRel(enableCheckExternalLinksRel?: boolean): void {
    if (!enableCheckExternalLinksRel) return;

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]'));

    let totalIssues = 0;

    links.forEach((link, index) => {
        const relAttr = link.getAttribute('rel') || '';
        const href = link.getAttribute('href') || '[no href]';
        const hasNoOpener = relAttr.includes('noopener');
        const hasNoReferrer = relAttr.includes('noreferrer');

        if (!hasNoOpener || !hasNoReferrer) {
            totalIssues++;

            console.error(`❌ [${index + 1}] External link "${href}" with target="_blank" is missing rel="noopener noreferrer". Potential security risk.`);

            link.title = '❌ Missing rel="noopener noreferrer". Security risk!';
        }
    });

    if (totalIssues === 0) {
        console.log('✅ All external links with target="_blank" have rel="noopener noreferrer".');
    } else {
        console.warn(`⚠️ Found ${totalIssues} external links missing rel="noopener noreferrer". Review the warnings above.`);
    }
}
