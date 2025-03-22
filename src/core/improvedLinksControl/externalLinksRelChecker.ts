/**
 * Checks all external links (<a> tags with target="_blank") for missing rel="noopener noreferrer".
 * Logs a warning if unsafe links are found.
 *
 * @returns {void}
 */
export function checkExternalLinksRel(): void {
    const links = Array.from(document.querySelectorAll('a[target="_blank"]')) as HTMLAnchorElement[];

    links.forEach((link) => {
        const relAttr = link.getAttribute('rel') || '';
        const href = link.getAttribute('href') || '[no href]';

        const hasNoOpener = relAttr.includes('noopener');
        const hasNoReferrer = relAttr.includes('noreferrer');

        if (!hasNoOpener || !hasNoReferrer) {
            console.error(`❌ External link "${href}" with target="_blank" is missing rel="noopener noreferrer". Potential security risk.`);

            // Optional: highlight the element in the DOM
            link.style.outline = '2px dashed black';
            link.title = 'Missing rel="noopener noreferrer"';
        }
    });
}
