import { logError, logWarning } from "../../sat/satLogger";

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 160;

/** Checks that <html> declares the page language (needed by screen readers and search engines). */
export function checkHtmlLang(enableCheckHtmlLang?: boolean): void {
    if (!enableCheckHtmlLang) return;

    const lang = document.documentElement.getAttribute('lang')?.trim();
    if (!lang) {
        logError('<html> has no lang attribute. Add one, e.g. <html lang="en">.');
    }
}

/**
 * Checks basic SEO metadata in <head>:
 * - <title>: present and not empty (warning above 60 characters);
 * - meta description: present and not empty (warning above 160 characters);
 * - meta viewport: present.
 */
export function checkSeoMeta(enableCheckSeoMeta?: boolean): void {
    if (!enableCheckSeoMeta) return;

    const title = document.title.trim();
    if (!title) {
        logError('Missing or empty <title>.');
    } else if (title.length > TITLE_MAX_LENGTH) {
        logWarning(`<title> is ${title.length} characters long; search results usually cut it after ${TITLE_MAX_LENGTH}.`);
    }

    const description = document.querySelector('meta[name="description" i]')?.getAttribute('content')?.trim();
    if (!description) {
        logError('Missing or empty <meta name="description">.');
    } else if (description.length > DESCRIPTION_MAX_LENGTH) {
        logWarning(`Meta description is ${description.length} characters long; search results usually cut it after ${DESCRIPTION_MAX_LENGTH}.`);
    }

    if (!document.querySelector('meta[name="viewport" i]')) {
        logWarning('Missing <meta name="viewport">. Add <meta name="viewport" content="width=device-width, initial-scale=1">.');
    }
}
