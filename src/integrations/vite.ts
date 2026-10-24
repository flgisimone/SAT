import type { Plugin } from 'vite';
import type { SATOptions } from '../sat/satOptions';

/** The SAT options that fit in JSON, plus `axe: true` to run axe-core too (install `axe-core`). */
export type SATViteOptions = Omit<Partial<SATOptions>, 'engines' | 'enabled'> & { axe?: boolean };

const MODULE_ID = 'virtual:seo-accessibility-tool';
const RESOLVED_ID = `\0${MODULE_ID}`;

/** The module the dev server adds to every page: it starts the panel with the plugin's options. */
function startModule({ axe, ...options }: SATViteOptions): string {
    const settings = `{ ...${JSON.stringify(options)}, enabled: true${axe ? ', engines: [axe()]' : ''} }`;
    return [
        `import { satChecker } from 'seo-accessibility-tool/sat-controller';`,
        axe ? `import { axe } from 'seo-accessibility-tool/axe';` : '',
        `satChecker(${settings});`,
    ].join('\n');
}

/**
 * Vite plugin: adds SAT to the pages of `vite dev` only. `vite build` and `vite preview`
 * don't include it, and the app's code doesn't import SAT.
 */
export function sat(options: SATViteOptions = {}): Plugin {
    return {
        name: 'seo-accessibility-tool',
        apply: 'serve',
        resolveId: (id) => (id === MODULE_ID ? RESOLVED_ID : undefined),
        load: (id) => (id === RESOLVED_ID ? startModule(options) : undefined),
        transformIndexHtml: () => [{ tag: 'script', attrs: { type: 'module', src: `/@id/${MODULE_ID}` }, injectTo: 'body' }],
    };
}
