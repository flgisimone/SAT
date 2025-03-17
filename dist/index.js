function useSAT() {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;
    headings.forEach((heading) => {
        const htmlHeading = heading;
        htmlHeading.style.outline = '';
        htmlHeading.style.backgroundColor = '';
        htmlHeading.removeAttribute('title');
    });
    headings.forEach((heading) => {
        const htmlHeading = heading;
        const currentLevel = parseInt(htmlHeading.tagName.replace('H', ''), 10);
        const text = htmlHeading.textContent?.trim() || '';
        if (currentLevel < lastLevel) {
            const message = `⚠️ Heading order issue: Found a ${htmlHeading.tagName} ("${text}") after a heading of lower level (H${lastLevel}).`;
            console.warn(message);
            htmlHeading.title = `Incorrect ${htmlHeading.tagName.toLowerCase()} order`;
        }
        lastLevel = currentLevel;
    });
    const h1Count = document.querySelectorAll('h1');
    const message = {
        messageMultipleH1: `⚠️ Multiple h1 found`,
        messageH1NotFound: `⚠️ H1 not found`
    };
    if (h1Count.length > 1) {
        console.warn(message.messageMultipleH1);
    }
    else if (h1Count.length === 0) {
        console.warn(message.messageH1NotFound);
    }
}

export { useSAT };
//# sourceMappingURL=index.js.map
