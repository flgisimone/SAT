import { describeElement, isElementVisible, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/**
 * `loading="lazy"` on images visible when the page opens (web.dev, "Lazy-loading images"):
 * the browser waits for layout before fetching them, which delays the Largest Contentful Paint.
 * Images below the fold or outside the viewport horizontally (carousels) are the right place for it.
 */
export const imageLazyLoad: Rule = {
    id: 'image-lazy-load',
    category: 'seo',
    defaultSeverity: 'warning',
    run({ document, report }) {
        const view = document.defaultView;
        if (!view) return;

        queryTargets<HTMLImageElement>('img[loading="lazy" i]', document).forEach((img) => {
            if (!isElementVisible(img)) return;

            // Position in the page, so the result doesn't depend on the current scroll.
            const rect = img.getBoundingClientRect();
            const top = rect.top + view.scrollY;
            const left = rect.left + view.scrollX;
            const inFirstView = top < view.innerHeight && top + rect.height > 0 && left < view.innerWidth && left + rect.width > 0;
            if (!inFirstView) return;

            report({
                element: img,
                message: `${describeElement(img)} (${img.getAttribute('src') || 'no src'}) is visible when the page opens but has loading="lazy", which delays it. Remove the attribute.`,
            });
        });
    },
};
