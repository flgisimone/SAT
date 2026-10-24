import { randomUUID } from 'node:crypto';
import type { Plugin, ViteDevServer } from 'vite';
import type { SATOptions } from '../sat/satOptions';
import { fixMiddleware } from './fixServer';

/**
 * The SAT options that fit in JSON, plus `axe: true` to run axe-core too (install `axe-core`)
 * and `ai: true` for "Fix with AI", which runs Claude Code (`claude -p`) in the project.
 */
export type SATViteOptions = Omit<Partial<SATOptions>, 'engines' | 'enabled' | 'aiFix'> & { axe?: boolean; ai?: boolean };

const MODULE_ID = 'virtual:seo-accessibility-tool';
const RESOLVED_ID = `\0${MODULE_ID}`;
const FIX_PATH = '/__sat/fix';
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/** The module the dev server adds to every page: it starts the panel with the plugin's options. */
function startModule({ axe, ai, ...options }: SATViteOptions, token: string): string {
    const aiFix = ai ? `, aiFix: ${JSON.stringify({ url: FIX_PATH, token })}` : '';
    const settings = `{ ...${JSON.stringify(options)}, enabled: true${axe ? ', engines: [axe()]' : ''}${aiFix} }`;
    return [
        `import { satChecker } from 'seo-accessibility-tool/sat-controller';`,
        axe ? `import { axe } from 'seo-accessibility-tool/axe';` : '',
        `satChecker(${settings});`,
    ].join('\n');
}

/** Origins of the dev server's pages: its URLs, and each local one under every loopback name. */
function serverOrigins(server: ViteDevServer): string[] {
    const urls = server.resolvedUrls;
    if (!urls) return [];
    const local = urls.local.flatMap((url) => {
        const { protocol, port } = new URL(url);
        return LOOPBACK_HOSTS.map((host) => `${protocol}//${host}${port ? `:${port}` : ''}`);
    });
    return [...local, ...urls.network.map((url) => new URL(url).origin)];
}

/**
 * Vite plugin: adds SAT to the pages of `vite dev` only. `vite build` and `vite preview`
 * don't include it, and the app's code doesn't import SAT.
 * With `ai: true` the dev server also answers `POST /__sat/fix` (see `fixMiddleware`).
 */
export function sat(options: SATViteOptions = {}): Plugin {
    // A new token for every dev server run: only the pages it serves know it.
    const token = randomUUID();
    return {
        name: 'seo-accessibility-tool',
        apply: 'serve',
        resolveId: (id) => (id === MODULE_ID ? RESOLVED_ID : undefined),
        load: (id) => (id === RESOLVED_ID ? startModule(options, token) : undefined),
        transformIndexHtml: () => [{ tag: 'script', attrs: { type: 'module', src: `/@id/${MODULE_ID}` }, injectTo: 'body' }],
        configureServer(server) {
            if (options.ai) server.middlewares.use(FIX_PATH, fixMiddleware(server.config.root, token, () => serverOrigins(server)));
        },
    };
}
