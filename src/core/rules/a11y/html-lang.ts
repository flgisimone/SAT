import type { Rule } from "../rule";

/** <html> declares the page language (WCAG 3.1.1), needed by screen readers and search engines. */
export const htmlLang: Rule = {
    id: 'html-lang',
    category: 'a11y',
    defaultSeverity: 'error',
    wcag: ['3.1.1'],
    run({ document, report }) {
        if (!document.documentElement.getAttribute('lang')?.trim()) {
            report({ message: '<html> has no lang attribute. Add one, e.g. <html lang="en">.' });
        }
    },
};
