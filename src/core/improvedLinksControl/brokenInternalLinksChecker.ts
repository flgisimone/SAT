import {logError} from "../../sat/satLogger";

/**
 * Checks all internal links (<a href>) on the page to detect broken links (404, 500).
 *
 * @param {boolean} enable - Enable or disable this checker.
 * @returns {Promise<void>} Logs broken links using the logger.
 */
export async function checkBrokenInternalLinks(enable: boolean): Promise<void> {
    if (!enable) return;

    const links = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
    const currentDomain = window.location.origin;

    const internalLinks = links.filter(link => {
        const href = link.getAttribute('href');
        return href && (
            href.startsWith('/') || href.startsWith(currentDomain)
        );
    });

    if (internalLinks.length === 0) {
        console.info('ℹ️ No internal links found for checking.');
        return;
    }

    const fetchPromises = internalLinks.map(async link => {
        const href = link.href.startsWith(currentDomain)
            ? link.href
            : `${currentDomain}${link.getAttribute('href')}`;

        try {
            const response = await fetch(href, { method: 'HEAD' });

            if (!response.ok) {
                const msg = `Broken internal link detected: ${href} (Status: ${response.status})`;
                logError(msg);

                link.style.outline = '2px solid red';
                link.title = `Broken link (Status: ${response.status})`;
            }
        } catch (error) {
            const msg = `Broken internal link fetch failed: ${href}`;
            logError(msg);

            link.style.outline = '2px solid red';
            link.title = 'Broken link (Fetch failed)';
        }
    });

    await Promise.all(fetchPromises);
}
