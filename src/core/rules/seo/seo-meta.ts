import type { Rule } from "../rule";

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 160;

/**
 * Basic SEO metadata in <head>:
 * - <title>: present and not empty (warning above 60 characters);
 * - meta description: present and not empty (warning above 160 characters);
 * - warning: meta viewport missing.
 */
export const seoMeta: Rule = {
    id: 'seo-meta',
    category: 'seo',
    defaultSeverity: 'error',
    run({ document, report }) {

        const title = document.title.trim();
        if (!title) {
            report({ message: 'Missing or empty <title>.' });
        } else if (title.length > TITLE_MAX_LENGTH) {
            report({
                message: `<title> is ${title.length} characters long; search results usually cut it after ${TITLE_MAX_LENGTH}.`,
                severity: 'warning',
            });
        }

        const description = document.querySelector('meta[name="description" i]')?.getAttribute('content')?.trim();
        if (!description) {
            report({ message: 'Missing or empty <meta name="description">.' });
        } else if (description.length > DESCRIPTION_MAX_LENGTH) {
            report({
                message: `Meta description is ${description.length} characters long; search results usually cut it after ${DESCRIPTION_MAX_LENGTH}.`,
                severity: 'warning',
            });
        }

        if (!document.querySelector('meta[name="viewport" i]')) {
            report({
                message: 'Missing <meta name="viewport">. Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
                severity: 'warning',
            });
        }
    },
};
