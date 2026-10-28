import { runSAT, type SATOptions } from '../core/seoAccessibilityTool';
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
};

window.__sat = api;
