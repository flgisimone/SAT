const tags = [
    'button',
    'a',
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])',
    'textarea',
    'nav',
    'header',
    'footer',
    'aside',
    'section',
    'main',
    'form',
    'svg'
];

const hasHeadingTags = ['nav', 'header', 'footer', 'aside', 'section', 'main', 'form'];

export default function ariaLabelChecker() {
    tags.forEach(tag => {
        const elements = document.querySelectorAll(tag);

        elements.forEach(el => {
            const hasAriaLabel =
                el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');

            if (!hasAriaLabel) {
                console.error(`❌ Missing ARIA label on <${tag}>`, el);
            }
        });
    });

    const elements = document.querySelectorAll(tags.join(','));

    elements.forEach((el, index) => {
        const tag = el.tagName.toLowerCase();

        const hasAriaLabel = el.hasAttribute('aria-label');
        const hasAriaLabelledby = el.hasAttribute('aria-labelledby');

        let isAccessible: boolean | Element | null = false;

        if (tag === 'button' || tag === 'a') {
            const hasText = (el.textContent || '').trim().length > 0;
            const hasImgWithAlt = el.querySelector('img[alt]');
            const hasSvgWithAria = el.querySelector('svg[aria-label]');

            isAccessible = hasAriaLabel || hasAriaLabelledby || hasText || hasImgWithAlt || hasSvgWithAria;

        } else if (tag === 'input' || tag === 'textarea') {
            const input = el as HTMLInputElement | HTMLTextAreaElement;
            const hasAssociatedLabel = input.labels && input.labels.length > 0;

            isAccessible = hasAriaLabel || hasAriaLabelledby || hasAssociatedLabel;

        } else if (hasHeadingTags.includes(tag)) {
            const hasHeading = el.querySelector('h1,h2,h3,h4,h5,h6');

            isAccessible = hasAriaLabel || hasAriaLabelledby || !!hasHeading;

        } else if (tag === 'svg') {
            const hasTitle = el.querySelector('title');
            const isDecorative = el.getAttribute('aria-hidden') === 'true';

            isAccessible = hasTitle || hasAriaLabel || isDecorative;
        }

        if (!isAccessible) {
            const elInfo = {
                index: index + 1,
                tag,
                id: el.id || 'No ID',
                class: el.className || 'No class',
                text: (el.textContent || '').trim() || 'No text'
            };

            console.error(
                `❌️️ ${tag.toUpperCase()} #${elInfo.index} is missing an accessible label!\n` +
                `👉 ID: ${elInfo.id}\n` +
                `👉 Class: ${elInfo.class}\n` +
                `👉 Text: "${elInfo.text}"`,
                el
            );

            (el as HTMLElement).style.outline = '2px solid red';
            (el as HTMLElement).style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            (el as HTMLElement).title = '❌️️ Missing accessible label';
        } else {
            console.info('✅ All tags have accessible label');
        }
    });
}