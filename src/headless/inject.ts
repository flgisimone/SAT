import { runSAT, type SATOptions } from '../core/seoAccessibilityTool';
import { collectInternalLinks } from '../core/rules/seo/link-broken';
import { cssSelector } from '../sat/issue';
import { axe } from '../engines/axe';

// Built as a standalone script (dist/sat-inject.js) that the Playwright helper and the CLI
// add to the page under test: the page needs no SAT import of its own.

declare global {
    interface Window {
        __sat?: typeof api;
    }
}

const api = {
    /** `axe` is true once axe-core has been added to the page (as `window.axe`). */
    run: (options: Partial<SATOptions>, useAxe: boolean) => runSAT(useAxe ? { ...options, engines: [axe()] } : options),
    /** Same-origin links of the page, without logout/delete-like URLs: one entry per URL. */
    internalLinks: () => Array.from(collectInternalLinks(document), ([url, links]) => ({ url, selector: cssSelector(links[0]), count: links.length })),
};

window.__sat = api;
