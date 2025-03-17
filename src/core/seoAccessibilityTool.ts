/**
 * Checks for the presence of `<h1>` tags in the document.
 * Logs a warning if:
 * - There are **no** `<h1>` tags present.
 * - There are **multiple** `<h1>` tags present.
 *
 * @returns {void}
 */
function checkH1(): void {
    const h1Count = document.querySelectorAll('h1');

    const message = {
        messageMultipleH1: `⚠️ Multiple h1 found`,
        messageH1NotFound: `⚠️ H1 not found`,
    }

    if (h1Count.length > 1) {
        console.warn(message.messageMultipleH1);
    } else if (h1Count.length === 0) {
        console.warn(message.messageH1NotFound);
    }
}

/**
 * Checks if the first `<h1>` element in the document is visible.
 * Visibility is determined by:
 * - `display` is not `none`.
 * - `visibility` is not `hidden`.
 * - `opacity` is not `0`.
 * - Element is within the viewport bounds.
 *
 * @returns {boolean} Returns `true` if the `<h1>` is visible and in the viewport, otherwise `false`.
 */
function checkH1Visible(): boolean {
    const h1Tag: HTMLHeadingElement | null = document.querySelector('h1');

    if (!h1Tag) {
        return false;
    }

    const style = window.getComputedStyle(h1Tag);

    const isDisplayed =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0';

    const rect = h1Tag.getBoundingClientRect();
    const inViewport =
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.left <= (window.innerWidth || document.documentElement.clientWidth);

    return isDisplayed && inViewport;
}

/**
 * Checks if the heading tags (`<h1>` to `<h6>`) are in sequential and descending order.
 * Logs a warning when a heading appears after a lower level heading (e.g., `<h3>` after `<h1>` without a `<h2>`).
 *
 * Additionally, it:
 * - Resets any previous visual warnings (outline, backgroundColor, title).
 * - Highlights headings out of order with a title and optional styles.
 *
 * @returns {void}
 */
function checkHeadingOrder(): void {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

    let lastLevel = 0;

    headings.forEach((heading) => {
        const htmlHeading = heading as HTMLElement;

        htmlHeading.style.outline = '';
        htmlHeading.style.backgroundColor = '';
        htmlHeading.removeAttribute('title');
    });

    headings.forEach((heading) => {
        const htmlHeading = heading as HTMLElement;
        const currentLevel = parseInt(htmlHeading.tagName.replace('H', ''), 10);
        const text = htmlHeading.textContent?.trim() || '';

        if (currentLevel < lastLevel) {
            const message = `⚠️ Heading order issue: Found a ${htmlHeading.tagName} ("${text}") after a heading of lower level (H${lastLevel}).`;

            console.warn(message);

            htmlHeading.title = `Incorrect ${htmlHeading.tagName.toLowerCase()} order`;
        }

        lastLevel = currentLevel;
    });
}

/**
 * Runs the complete SEO Accessibility Tool (SAT) checks:
 * - Checks heading order (`<h1>` to `<h6>`) for hierarchy issues.
 * - Checks the presence of `<h1>` tags (multiple or missing).
 * - Checks if the `<h1>` is visible in the viewport.
 *
 * @returns {void}
 */
export function useSAT(): void {
    checkHeadingOrder();
    checkH1();
    checkH1Visible();
}
