import { describeElement, isAriaHidden, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

const FILENAME_LIKE = /\.(png|jpe?g|gif|svg|webp|avif|bmp)$/i;

/**
 * Images have alternative text (WCAG 1.1.1).
 * - Error: <img> without an alt attribute (use alt="" for decorative images).
 * - Warning: alt text that looks like a file name.
 */
export const imageAlt: Rule = {
    id: 'image-alt',
    title: 'Images have alternative text',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['1.1.1'],
    run({ document, report }) {

        queryTargets<HTMLImageElement>('img', document).forEach((img) => {
            if (isAriaHidden(img)) return;
            const role = img.getAttribute('role');
            if (role === 'presentation' || role === 'none') return;

            const alt = img.getAttribute('alt');

            if (alt === null) {
                if (img.getAttribute('aria-label')?.trim() || img.hasAttribute('aria-labelledby')) return;

                report({
                    element: img,
                    message: `<img src="${img.getAttribute('src') || '[no src]'}"> has no alt attribute. Describe the image, or use alt="" if it is decorative.`,
                });
                return;
            }

            if (FILENAME_LIKE.test(alt.trim())) {
                report({
                    element: img,
                    message: `Alt text looks like a file name on ${describeElement(img)}: "${alt}". Describe what the image shows.`,
                    severity: 'warning',
                });
            }
        });
    },
};
