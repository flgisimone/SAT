import { queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";
import { isAbsoluteUrl } from "./canonical";

/** ISO 639-1 language, optional script and ISO 3166-1 region or UN M.49 code (e.g. "en", "en-GB", "zh-Hant-TW", "es-419"). */
const LANGUAGE_CODE = /^[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?$/i;

/**
 * Alternate language versions (Google Search Central, "Localized versions of your page"), errors
 * because Google ignores such annotations:
 * - an hreflang that is not a language code (with optional region) or `x-default`;
 * - a relative href (Google requires fully qualified URLs);
 * - the same hreflang pointing to different URLs.
 *
 * The return links on the other pages can't be checked without requests and are not.
 */
export const hreflang: Rule = {
    id: 'hreflang',
    category: 'seo',
    defaultSeverity: 'error',
    run({ document, report }) {

        const urls = new Map<string, string>();
        queryTargets<HTMLLinkElement>('link[rel~="alternate" i][hreflang]', document).forEach((link) => {
            const code = link.getAttribute('hreflang')!.trim();
            const href = link.getAttribute('href')?.trim() ?? '';

            if (code.toLowerCase() !== 'x-default' && !LANGUAGE_CODE.test(code)) {
                report({ element: link, message: `hreflang="${code}" is not a language code (e.g. "en" or "en-GB") or "x-default".` });
            }
            if (!isAbsoluteUrl(href)) {
                report({ element: link, message: `hreflang="${code}" has ${href ? `a relative URL "${href}"` : 'an empty href'}. Use an absolute URL (https://…).` });
            }

            const key = code.toLowerCase();
            const seen = urls.get(key);
            if (seen === undefined) urls.set(key, href);
            else if (seen !== href) report({ element: link, message: `hreflang="${code}" points to both "${seen}" and "${href}". Keep one URL per language.` });
        });
    },
};
