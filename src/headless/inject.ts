import { runSAT, seoAccessibilityTool, type SATOptions } from '../core/seoAccessibilityTool';
import { axe } from '../engines/axe';
import { pageResults } from '../sat/mcpResults';

// Built as a standalone script (dist/sat-inject.js) that the Playwright helper, the CLI and `sat_check`
// add to the page under test: the page needs no SAT import of its own.

declare global {
    interface Window {
        __sat?: typeof api;
    }
}

/** `useAxe` is true once axe-core has been added to the page (as `window.axe`). */
const withAxe = (options: Partial<SATOptions>, useAxe: boolean) => (useAxe ? { ...options, engines: [axe()] } : options);

const api = {
    run: (options: Partial<SATOptions>, useAxe: boolean) => runSAT(withAxe(options, useAxe)),
    /** The results as the open pages send them to the MCP server: the prompt of `fixPrompt` and the issues. */
    results: async (options: Partial<SATOptions>, useAxe: boolean) => pageResults((await seoAccessibilityTool(withAxe(options, useAxe))).issues),
};

window.__sat = api;
