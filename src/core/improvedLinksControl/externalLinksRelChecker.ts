import { logWarning } from "../../sat/satLogger";
import { highlight, queryTargets } from "../../sat/satDom";

/**
 * Checks links with target="_blank" for missing rel="noopener noreferrer".
 * Logs a warning if unsafe links are found.
 *
 * @returns {void}
 */
export function checkExternalLinksRel(enableCheckExternalLinksRel?: boolean): void {
    if (!enableCheckExternalLinksRel) return;

    queryTargets<HTMLAnchorElement>('a[target="_blank"]').forEach((link) => {
        const rel = (link.getAttribute('rel') || '').toLowerCase().split(/\s+/);
        const href = link.getAttribute('href') || '[no href]';

        if (!rel.includes('noopener') || !rel.includes('noreferrer')) {
            logWarning(`Link "${href}" with target="_blank" is missing rel="noopener noreferrer".`);
            highlight(link, { outline: '2px dashed black', title: 'Missing rel="noopener noreferrer"' });
        }
    });
}
