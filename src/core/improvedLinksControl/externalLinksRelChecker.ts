import {logWarning} from "../../sat/satLogger";

/**
 * Checks all external links (<a> tags with target="_blank") for missing rel="noopener noreferrer".
 * Logs a warning if unsafe links are found.
 *
 * @returns {void}
 */
export function checkExternalLinksRel(enableCheckExternalLinksRel?: boolean): void {
    if (!enableCheckExternalLinksRel) return;

    const links = Array.from(document.querySelectorAll('a[target="_blank"]')) as HTMLAnchorElement[];

    links.forEach((link) => {
        const relAttr = link.getAttribute('rel') || '';
        const href = link.getAttribute('href') || '[no href]';

        const hasNoOpener = relAttr.includes('noopener');
        const hasNoReferrer = relAttr.includes('noreferrer');

        if (!hasNoOpener || !hasNoReferrer) {
            const msg = `External link "${href}" with target="_blank" is missing rel="noopener noreferrer". Potential security risk.`;
            logWarning(msg);

            link.style.outline = '2px dashed black';
            link.title = 'Missing rel="noopener noreferrer"';
        }
    });
}
