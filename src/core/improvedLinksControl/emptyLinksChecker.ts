/**
 * Checks for anchor tags (<a>) with empty or invalid href attributes.
 * Logs warnings for:
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

        // Cases where the href is missing or empty
        if (!href) {
            console.error(`❌ <a> with no href found: "${text}". Consider using <button> if it's an action.`);

            link.style.outline = '2px dashed orange';

            return;
        }

        if (href === '#' || href === '') {
            const hasOnClick = link.hasAttribute('onclick');
            const isProperRole = role === 'button' || role === 'link';

            if (!hasOnClick && !isProperRole) {
                console.error(`<a href="${href}"> without event handling: "${text}". Add preventDefault or consider a <button> instead.`);
            } else {
                console.error(`❌ <a href="${href}"> found with onclick, but consider using a <button> for better semantics: "${text}".`);
            }

            link.style.outline = '2px dashed brown';
        }
    });
}
