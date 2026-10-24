import { describeElement, isRendered, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

let languageNames: Intl.DisplayNames | undefined;

/**
 * A language tag whose primary subtag is a known language (ACT bf051a, de46e4): only the primary
 * subtag decides, so "en-US-GB" is valid. Two-letter languages (ISO 639-1) are all known to Intl,
 * so an unknown one is invalid; three-letter ones are accepted. `ponytail:` no copy of the IANA
 * registry, so "eng" (registered as "en") passes: add one if invalid three-letter codes turn up.
 */
export function isValidLanguageTag(tag: string): boolean {
    const primary = tag.trim().split('-')[0].toLowerCase();
    if (primary.length === 3) return /^[a-z]{3}$/.test(primary);
    if (!/^[a-z]{2}$/.test(primary)) return false;
    languageNames ??= new Intl.DisplayNames(['en'], { type: 'language', fallback: 'code' });
    return languageNames.of(primary) !== primary;
}

/**
 * True when some rendered text, or the alt of an image, takes its language from this element:
 * a lang attribute without text of its own changes nothing (ACT de46e4 applicability).
 */
function hasOwnText(el: Element): boolean {
    const owns = (node: Element) => node.closest('[lang]') === el && isRendered(node);
    const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.textContent!.trim() && owns(node.parentElement!)) return true;
    }
    return Array.from(el.querySelectorAll('img[alt]')).some((img) => img.getAttribute('alt')!.trim() && owns(img));
}

/**
 * Language of the page and of its parts (WCAG 3.1.1, 3.1.2):
 * - <html> has a lang attribute (ACT b5c3f8) with a valid language tag (ACT bf051a);
 * - every other lang attribute with text of its own is a valid language tag (ACT de46e4).
 * lang="" on an element means "unknown language" and is valid; lang=" " is not.
 */
export const htmlLang: Rule = {
    id: 'html-lang',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['3.1.1'],
    run({ document, report }) {
        const root = document.documentElement;
        const lang = root.getAttribute('lang')?.trim();
        if (!lang) {
            report({ message: '<html> has no lang attribute. Add one, e.g. <html lang="en">.' });
        } else if (!isValidLanguageTag(lang)) {
            report({ message: `<html lang="${lang}"> is not a valid language tag. Use a code such as "en", "en-GB" or "pt-BR".` });
        }

        queryTargets('body [lang]', document).forEach((el) => {
            const value = el.getAttribute('lang')!;
            if (!value || isValidLanguageTag(value) || !hasOwnText(el)) return;
            report({
                element: el,
                message: `${describeElement(el)} has lang="${value}", which is not a valid language tag. Use a code such as "en" or "fr-CA".`,
                wcag: ['3.1.2'],
            });
        });
    },
};
