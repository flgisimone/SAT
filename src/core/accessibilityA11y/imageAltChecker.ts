import { logError, logWarning } from "../../sat/satLogger";
import { describeElement, highlight, isAriaHidden, queryTargets } from "../../sat/satDom";

const FILENAME_LIKE = /\.(png|jpe?g|gif|svg|webp|avif|bmp)$/i;

/**
 * Checks images for alternative text.
 * - Error: <img> without an alt attribute (use alt="" for decorative images).
 * - Warning: alt text that looks like a file name.
 */
export function checkImageAlt(enableCheckImageAlt?: boolean): void {
    if (!enableCheckImageAlt) return;

    queryTargets<HTMLImageElement>('img').forEach((img) => {
        if (isAriaHidden(img)) return;
        const role = img.getAttribute('role');
        if (role === 'presentation' || role === 'none') return;

        const alt = img.getAttribute('alt');
        const src = img.getAttribute('src') || '[no src]';

        if (alt === null) {
            if (img.getAttribute('aria-label')?.trim() || img.hasAttribute('aria-labelledby')) return;

            logError(`<img src="${src}"> has no alt attribute. Describe the image, or use alt="" if it is decorative.`);
            highlight(img, { outline: '3px solid red', title: '❌ Missing alt attribute' });
            return;
        }

        if (FILENAME_LIKE.test(alt.trim())) {
            logWarning(`Alt text looks like a file name on ${describeElement(img)}: "${alt}". Describe what the image shows.`);
            highlight(img, { outline: '3px dashed orange', title: '⚠️ Alt text looks like a file name' });
        }
    });
}
