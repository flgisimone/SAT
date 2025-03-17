function isH1Visible(h1Tag: HTMLElement): boolean {
    if (!h1Tag) return false;

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

export function useSAT() {
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


    const h1Tag = document.querySelector('h1');
    const h1Count = document.querySelectorAll('h1');
    const message = {
        messageMultipleH1: `⚠️ Multiple h1 found`,
        messageH1NotFound: `⚠️ H1 not found`,
        messageH1Visible:`⚠️ H1 not visible`
    }

    if (h1Count.length > 1) {
        console.warn(message.messageMultipleH1);
    } else if (h1Count.length === 0) {
        console.warn(message.messageH1NotFound);
    }

    if (h1Tag) {
        const visible = isH1Visible(h1Tag);

        if (!visible) {
            console.warn(message.messageH1Visible);
        }
    }
}
