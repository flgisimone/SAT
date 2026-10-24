import { queryTargets } from "../../../sat/satDom";
import type { Rule } from "../rule";

/**
 * Basic SEO metadata in <head>:
 * - <title>: present, not empty and only one;
 * - meta description: present, not empty and only one;
 * - warning: meta viewport missing.
 *
 * No length limits: Google Search Central states there is none for either, and shortens them to fit the device.
 */
export const seoMeta: Rule = {
    id: 'seo-meta',
    category: 'seo',
    defaultSeverity: 'error',
    run({ document, report }) {

        const title = document.title.trim();
        if (!title) {
            report({ message: 'Missing or empty <title>.' });
        }

        // HTML allows one <title> and one meta description per document.
        const titles = queryTargets('title', document).filter((el) => !el.closest('svg'));
        if (titles.length > 1) {
            report({ element: titles[1], message: `${titles.length} <title> elements found; keep only one.` });
        }
        const descriptions = queryTargets('meta[name="description" i]', document);
        if (descriptions.length > 1) {
            report({ element: descriptions[1], message: `${descriptions.length} <meta name="description"> found; keep only one.` });
        }

        const description = document.querySelector('meta[name="description" i]')?.getAttribute('content')?.trim();
        if (!description) {
            report({ message: 'Missing or empty <meta name="description">.' });
        }

        if (!document.querySelector('meta[name="viewport" i]')) {
            report({
                message: 'Missing <meta name="viewport">. Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
                severity: 'warning',
            });
        }
    },
};
