import { logError } from "../../sat/satLogger";

/**
 * Checks for anchor tags (<a>) with empty or invalid href attributes.
 * Logs errors for:
 * - <a> elements without href
 * - href="#" or href=""
 * Suggests replacing with a <button> if it acts as an action trigger.
 */
export function checkEmptyLinks(enableCheckEmptyLinks?: boolean): void {
    if (!enableCheckEmptyLinks) return;

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'));

    links.forEach(link => {
        const href = link.getAttribute('href');
        const text = link.textContent?.trim() || '[no text]';
        const role = link.getAttribute('role') || '';

        // Case 1: <a> without href
        if (!href) {
            const msg = `<a> tag with no href found: "${text}". Consider using <button> if it triggers an action.`;
            logError(msg);

            link.style.outline = '2px dashed orange';
            link.title = msg;

            return;
        }

        // Case 2: href="#" or empty string
        if (href === '#' || href === '') {
            const hasOnClick = link.hasAttribute('onclick');
            const isProperRole = role === 'button' || role === 'link';

            if (!hasOnClick && !isProperRole) {
                const msg = `<a href="${href}"> without event handling: "${text}". Add preventDefault or consider using a <button>.`;
                logError(msg);

                link.style.outline = '2px dashed brown';
                link.title = msg;
            } else {
                const msg = `<a href="${href}"> has onclick, but consider using a <button> for semantic clarity: "${text}".`;
                logError(msg);

                link.style.outline = '2px dashed brown';
                link.title = msg;
            }
        }
    });
}
