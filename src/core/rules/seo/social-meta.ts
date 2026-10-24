import type { Rule } from "../rule";
import { isAbsoluteUrl } from "./canonical";

/** Required by the Open Graph protocol (ogp.me, "Basic Metadata"). */
const OG_REQUIRED = ['og:title', 'og:type', 'og:image', 'og:url'];
/** Open Graph properties that must be absolute URLs. */
const OG_URLS = ['og:image', 'og:url'];

/**
 * Link previews when the page is shared, all warnings:
 * - the four required Open Graph properties (ogp.me), with og:image and og:url absolute;
 * - `twitter:card` (X falls back to Open Graph for title, description and image, not for the card type).
 */
export const socialMeta: Rule = {
    id: 'social-meta',
    title: 'Social sharing tags are set',
    source: 'Open Graph',
    category: 'seo',
    defaultSeverity: 'warning',
    run({ document, report }) {

        const content = (attr: 'property' | 'name', value: string) =>
            document.querySelector(`meta[${attr}="${value}" i]`)?.getAttribute('content')?.trim() ?? '';

        const missing = OG_REQUIRED.filter((property) => !content('property', property));
        if (missing.length) {
            report({ message: `Missing Open Graph ${missing.map((p) => `<meta property="${p}">`).join(', ')}: link previews may be incomplete.` });
        }

        OG_URLS.forEach((property) => {
            const value = content('property', property);
            if (value && !isAbsoluteUrl(value)) {
                report({ message: `<meta property="${property}" content="${value}"> must be an absolute URL (https://…).` });
            }
        });

        if (!content('name', 'twitter:card')) {
            report({ message: 'Missing <meta name="twitter:card"> (e.g. "summary_large_image"): X shows no card without it.' });
        }
    },
};
