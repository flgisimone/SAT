/**
 * Checks for anchor tags (<a>) with empty or invalid href attributes.
 * Logs warnings for:
 * - <a> elements without href
 * - href="#" or href=""
 * Suggests replacing with a <button> if it acts as an action trigger.
 *
 * @param enableCheckEmptyLinks - Enable/disable this checker
 */
export function checkEmptyLinks(enableCheckEmptyLinks?: boolean): void {
    if (!enableCheckEmptyLinks) return;

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'));

    let totalIssues = 0;

    links.forEach((link, index) => {
        const href = link.getAttribute('href');
        const text = link.textContent?.trim() || '[no text]';
        const role = link.getAttribute('role') || '';
        const hasOnClick = link.hasAttribute('onclick');

        // Case 1: <a> without href
        if (!href) {
            totalIssues++;

            console.error(`❌ [${index + 1}] <a> with no href found: "${text}". Suggestion: If it's an action, use <button>.`);

            link.title = '❌ Missing href attribute. Consider using <button> if it triggers an action.';

            return; // Skip further checks for this link
        }

        // Case 2: <a href="#"> or empty href
        if (href === '#' || href === '') {
            totalIssues++;

            if (!hasOnClick && !(role === 'button' || role === 'link')) {
                console.error(`❌ [${index + 1}] <a href="${href}"> without event handling found: "${text}". Suggestion: Add preventDefault() or use a <button> instead.`);

                link.title = '❌ Empty href and no event handling. Consider using <button>.';
            } else {
                console.warn(`⚠️ [${index + 1}] <a href="${href}"> has onclick handler but consider using a <button> for better semantics: "${text}".`);

                link.title = '⚠️ Has onclick but consider using <button> for accessibility.';
            }
        }
    });

    if (totalIssues === 0) {
        console.log('✅ No empty or invalid links detected.');
    } else {
        console.warn(`⚠️ Found ${totalIssues} empty or invalid links. Review the suggestions above.`);
    }
}
