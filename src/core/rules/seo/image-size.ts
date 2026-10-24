import { computedStyle, describeElement, isElementVisible, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/** A CSS length that fixes the box (not auto, not a percentage of the container). */
const FIXED_LENGTH = /^\d*\.?\d+(px|r?em|vw|vh|ch)$/;

/**
 * `<img>` without `width` and `height` (web.dev, "Optimize Cumulative Layout Shift"): the browser
 * can't reserve the space before the image loads, so the content below it moves.
 *
 * Not reported: hidden images, absolutely or fixed positioned ones (they don't move other content),
 * and images sized by CSS with `aspect-ratio` or inline width and height. Sizes set by a stylesheet
 * class can't be told from computed styles, hence a warning.
 */
export const imageSize: Rule = {
    id: 'image-size',
    category: 'seo',
    defaultSeverity: 'warning',
    run({ document, report }) {

        queryTargets<HTMLImageElement>('img', document).forEach((img) => {
            if (img.hasAttribute('width') && img.hasAttribute('height')) return;
            if (FIXED_LENGTH.test(img.style.width) && FIXED_LENGTH.test(img.style.height)) return;
            if (!isElementVisible(img)) return;

            const style = computedStyle(img);
            if (style.position === 'absolute' || style.position === 'fixed') return;
            if (style.aspectRatio && style.aspectRatio !== 'auto') return;

            report({
                element: img,
                message: `${describeElement(img)} (${img.getAttribute('src') || 'no src'}) has no width and height: the page shifts when it loads. Add the attributes or a CSS aspect-ratio.`,
            });
        });
    },
};
