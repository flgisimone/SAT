import { useEffect } from 'react';

function useSAT(options) {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;
    const tagColors = {
        H1: { outline: '2px solid #FF0000', background: 'rgba(255, 0, 0, 0.1)' },
        H2: { outline: '2px solid #FF8000', background: 'rgba(255, 128, 0, 0.1)' },
        H3: { outline: '2px solid #FFD700', background: 'rgba(255, 215, 0, 0.1)' },
        H4: { outline: '2px solid #008000', background: 'rgba(0, 128, 0, 0.1)' },
        H5: { outline: '2px solid #0000FF', background: 'rgba(0, 0, 255, 0.1)' },
        H6: { outline: '2px solid #800080', background: 'rgba(128, 0, 128, 0.1)' },
    };
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
            const colors = tagColors[htmlHeading.tagName] || {
                outline: '2px solid black',
                background: 'rgba(0, 0, 0, 0.1)',
            };
            htmlHeading.style.outline = colors.outline;
            htmlHeading.style.backgroundColor = colors.background;
            htmlHeading.title = `Incorrect ${htmlHeading.tagName.toLowerCase()} order`;
        }
        lastLevel = currentLevel;
    });
    const h1Count = document.querySelectorAll('h1');
    const message = `⚠️ Multiple h1 found`;
    if (h1Count.length > 1) {
        console.warn(message);
    }
}

const seoAccessibilityTool = ({ delay = 100, callback } = {}) => {
    useEffect(() => {
        useSAT();
        const timeout = setTimeout(() => {
            useSAT();
        }, delay);
        return () => clearTimeout(timeout);
    }, []);
};

export { seoAccessibilityTool as default, seoAccessibilityTool };
//# sourceMappingURL=react.js.map
