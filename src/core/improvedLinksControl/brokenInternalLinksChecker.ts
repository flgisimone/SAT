/**
 * Checks all internal links (<a href>) on the page to detect broken links (404, 500).
 *
 * @param {boolean} enable - Enable or disable this checker.
 * @returns {Promise<void>} Logs broken links in the console.
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
        const href = link.href.startsWith(currentDomain) ? link.href : `${currentDomain}${link.getAttribute('href')}`;

        try {
            const response = await fetch(href, { method: 'HEAD' });
            if (!response.ok) {
                console.error(`❌ Broken link detected: ${href} (Status: ${response.status})`);

                link.style.outline = '2px solid red';
                link.title = `Broken link (Status: ${response.status})`;
            } else {
                console.log(`✅ Link OK: ${href}`);
            }
        } catch (error) {
            console.error(`❌ Error checking link: ${href}`, error);

            link.style.outline = '2px solid red';
            link.title = 'Broken link (Fetch failed)';
        }
    });

    await Promise.all(fetchPromises);
}
