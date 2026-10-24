import { describeElement, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/** Blocked by browsers on https pages (active mixed content). */
const ACTIVE = 'script[src], iframe[src], embed[src], object[data], link[href]';
/** Upgraded to https by browsers, or blocked if the upgrade fails (passive mixed content). */
const PASSIVE = 'img[src], img[srcset], source[src], source[srcset], audio[src], video[src], video[poster], track[src], input[type="image" i][src]';
/** `<link>` relations that load the resource; alternate, canonical and the like are just URLs. */
const LOADED_LINK = /\b(stylesheet|icon|preload|modulepreload|prefetch|manifest|apple-touch-icon)\b/i;
const URL_ATTRIBUTES = ['src', 'href', 'data', 'poster', 'srcset'];

function httpUrls(el: Element): string[] {
    return URL_ATTRIBUTES.flatMap((attr) => {
        const value = el.getAttribute(attr);
        if (!value) return [];
        const urls = attr === 'srcset' ? value.split(',').map((candidate) => candidate.trim().split(/\s+/)[0]) : [value.trim()];
        return urls.filter((url) => /^http:\/\//i.test(url));
    });
}

/**
 * Resources loaded over `http:` by an `https:` page (W3C Mixed Content):
 * scripts, frames, stylesheets and objects are blocked (error); images and media are
 * upgraded or blocked (warning). Links to `http:` pages are navigation, not mixed content.
 */
export const mixedContent: Rule = {
    id: 'mixed-content',
    category: 'seo',
    defaultSeverity: 'error',
    run({ document, report }) {
        if (new URL(document.URL).protocol !== 'https:') return;

        const check = (selector: string, severity: 'error' | 'warning') =>
            queryTargets(selector, document).forEach((el) => {
                if (el.localName === 'link' && !LOADED_LINK.test(el.getAttribute('rel') ?? '')) return;
                const urls = httpUrls(el);
                if (!urls.length) return;
                const effect = severity === 'error' ? 'block it' : 'upgrade it to https or block it';
                report({ element: el, severity, message: `${describeElement(el)} loads "${urls[0]}" over http on an https page: browsers ${effect}.` });
            });

        check(ACTIVE, 'error');
        check(PASSIVE, 'warning');
    },
};
