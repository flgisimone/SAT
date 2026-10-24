import { describeElement, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/** Audio that stops within 3 seconds is allowed by WCAG 1.4.2. */
const MAX_SECONDS = 3;

/** True when every source ends within 3 seconds through a media fragment (#t=start,end). */
function playsBriefly(media: HTMLMediaElement): boolean {
    const sources = [media.getAttribute('src'), ...Array.from(media.querySelectorAll('source'), (source) => source.getAttribute('src'))].filter(Boolean) as string[];
    return sources.length > 0 && sources.every((src) => {
        const match = /#t=(?:npt:)?([\d.]*),([\d.]+)$/.exec(src);
        return match !== null && Number(match[2]) - Number(match[1] || 0) <= MAX_SECONDS;
    });
}

/**
 * Media that start playing with sound (ACT 80f0bf, WCAG 1.4.2): <video> and <audio> with autoplay,
 * not muted and without controls to pause them. A warning: SAT can't tell whether the file has
 * sound, how long it lasts or whether the page offers its own pause button.
 */
export const mediaAutoplay: Rule = {
    id: 'media-autoplay',
    category: 'a11y',
    defaultSeverity: 'warning',
    wcag: ['1.4.2'],
    run({ document, report }) {
        queryTargets<HTMLMediaElement>('video[autoplay], audio[autoplay]', document).forEach((media) => {
            // React sets muted as a property, not as an attribute.
            if (media.muted || media.hasAttribute('muted') || media.hasAttribute('controls') || playsBriefly(media)) return;

            report({
                element: media,
                message: `${describeElement(media)} plays automatically and can't be paused. If it has sound for more than 3 seconds, add muted or controls, or a button to stop it.`,
            });
        });
    },
};
