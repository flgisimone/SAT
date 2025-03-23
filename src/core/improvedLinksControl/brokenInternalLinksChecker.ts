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

    console.log(`🔗 Starting internal link check for ${internalLinks.length} links...`);

    let brokenCount = 0;
    let validCount = 0;

    const fetchPromises = internalLinks.map(async (link, index) => {
        const rawHref = link.getAttribute('href') || '';
        const absoluteHref = rawHref.startsWith('http')
            ? rawHref
            : `${currentDomain}${rawHref.startsWith('/') ? rawHref : `/${rawHref}`}`;

        try {
            const response = await fetch(absoluteHref, { method: 'HEAD' });

            if (!response.ok) {
                brokenCount++;
                console.error(`❌ [${index + 1}] Broken link detected: ${absoluteHref} (Status: ${response.status})`);

                link.title = `❌ Broken link (Status: ${response.status})`;
            } else {
                validCount++;

                console.log(`✅ [${index + 1}] Link OK: ${absoluteHref}`);
            }

        } catch (error) {
            brokenCount++;
            console.error(`❌ [${index + 1}] Error checking link: ${absoluteHref}`, error);

            link.title = '❌ Broken link (Fetch failed)';
        }
    });

    await Promise.all(fetchPromises);

    if (brokenCount === 0) {
        console.log(`✅ All ${validCount} internal links are working correctly!`);
    } else {
        console.warn(`⚠️ Checked ${internalLinks.length} internal links: ${brokenCount} broken, ${validCount} valid.`);
    }
}
