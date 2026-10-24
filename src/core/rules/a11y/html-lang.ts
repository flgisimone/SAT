import { describeElement, queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

let languageNames: Intl.DisplayNames | undefined;

/**
 * A well-formed BCP 47 tag whose primary language exists (ACT bf051a, de46e4).
 * Two-letter languages (ISO 639-1) are all known to Intl, so an unknown one is invalid; three-letter
 * ones (ISO 639-2/3) are accepted. `ponytail:` no copy of the IANA registry: only add one if invalid
 * three-letter codes turn up in practice.
 */
export function isValidLanguageTag(tag: string): boolean {
    let canonical: string;
    try {
        canonical = Intl.getCanonicalLocales(tag.trim())[0];
    } catch {
        return false;
    }
    const primary = canonical.split('-')[0];
    if (primary.length === 3) return true;
    if (primary.length !== 2) return false;
    languageNames ??= new Intl.DisplayNames(['en'], { type: 'language', fallback: 'code' });
    return languageNames.of(primary) !== primary;
}

/**
 * Language of the page and of its parts (WCAG 3.1.1, 3.1.2):
 * - <html> has a lang attribute (ACT b5c3f8) with a valid language tag (ACT bf051a);
 * - every other non-empty lang attribute is a valid language tag (ACT de46e4).
 * lang="" on an element means "unknown language" and is valid.
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
            const value = el.getAttribute('lang')!.trim();
            if (!value || isValidLanguageTag(value)) return;
            report({
                element: el,
                message: `${describeElement(el)} has lang="${value}", which is not a valid language tag. Use a code such as "en" or "fr-CA".`,
                wcag: ['3.1.2'],
            });
        });
    },
};
