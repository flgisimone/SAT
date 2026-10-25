import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import type { SATOptions } from '../sat/satOptions';
import { fixMiddleware } from './fixServer';
import { mcpMiddleware, resultsMiddleware, resultsStore } from './mcpServer';

/**
 * The SAT options that fit in JSON, plus:
 * - `axe`: runs axe-core too; on by default when `axe-core` is installed in the project, `false` turns it off;
 * - `ai: true` for "Fix with AI", which runs Claude Code (`claude -p`) in the project;
 * - `mcp: true` for the MCP server at `/__sat/mcp`, which gives the issues of the open pages to any AI agent.
 */
export type SATViteOptions = Omit<Partial<SATOptions>, 'engines' | 'enabled' | 'aiFix' | 'mcp'> & { axe?: boolean; ai?: boolean; mcp?: boolean };

const MODULE_ID = 'virtual:seo-accessibility-tool';
const RESOLVED_ID = `\0${MODULE_ID}`;
const FIX_PATH = '/__sat/fix';
const RESULTS_PATH = '/__sat/results';
const MCP_PATH = '/__sat/mcp';
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/** The module the dev server adds to every page: it starts the panel with the plugin's options. */
function startModule({ axe, ai, mcp, ...options }: SATViteOptions, token: string): string {
    const aiFix = ai ? `, aiFix: ${JSON.stringify({ url: FIX_PATH, token })}` : '';
    // `sat_recheck` reaches the pages as the custom HMR event `sat:run`.
    const results = mcp ? `, mcp: { ...${JSON.stringify({ url: RESULTS_PATH, token })}, listen: (run) => import.meta.hot?.on('sat:run', run) }` : '';
    const settings = `{ ...${JSON.stringify(options)}, enabled: true${axe ? ', engines: [axe()]' : ''}${aiFix}${results} }`;
    return [
        `import { satChecker } from 'seo-accessibility-tool/sat-controller';`,
        axe ? `import { axe } from 'seo-accessibility-tool/axe';` : '',
        `satChecker(${settings});`,
    ].join('\n');
}

/** Whether `name` can be imported from the project in `root`. */
function installed(name: string, root: string): boolean {
    try {
        createRequire(join(root, 'package.json')).resolve(name);
        return true;
    } catch {
        return false;
    }
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

function serverPort(server: ViteDevServer): number | undefined {
    return (server.httpServer?.address() as AddressInfo | null)?.port;
}

/** Adds the MCP endpoint and the endpoint the pages send their results to; prints the URL for the agents. */
function addMCP(server: ViteDevServer, token: string): void {
    const store = resultsStore();
    const origins = () => serverOrigins(server);
    server.middlewares.use(RESULTS_PATH, resultsMiddleware(store, token, origins));
    server.middlewares.use(MCP_PATH, mcpMiddleware({
        store,
        recheck: () => {
            server.ws.send('sat:run');
            return server.ws.clients.size;
        },
        hosts: () => LOOPBACK_HOSTS.map((host) => `${host}:${serverPort(server)}`),
        origins,
    }));

    server.httpServer?.once('listening', () => {
        const url = `${server.config.server.https ? 'https' : 'http'}://localhost:${serverPort(server)}${MCP_PATH}`;
        const { logger } = server.config;
        logger.info(`  SAT: MCP server at ${url}`);
        logger.info(`  SAT: for Claude Code, claude mcp add --transport http sat ${url}`);
        if (!server.config.server.strictPort) logger.info('  SAT: set server.strictPort so the port, and the URL of the MCP server, never change');
    });
}

/**
 * Vite plugin: adds SAT to the pages of `vite dev` only. `vite build` and `vite preview`
 * don't include it, and the app's code doesn't import SAT.
 * With `ai: true` the dev server also answers `POST /__sat/fix` (see `fixMiddleware`),
 * with `mcp: true` `POST /__sat/mcp` (see `mcpMiddleware`).
 */
export function sat(options: SATViteOptions = {}): Plugin {
    // A new token for every dev server run: only the pages it serves know it.
    const token = randomUUID();
    let settings = options;
    return {
        name: 'seo-accessibility-tool',
        apply: 'serve',
        configResolved(config) {
            if (options.axe !== undefined) return;
            const axe = installed('axe-core', config.root);
            settings = { ...options, axe };
            if (axe) config.logger.info('  SAT: axe-core found, running it as an engine');
        },
        resolveId: (id) => (id === MODULE_ID ? RESOLVED_ID : undefined),
        load: (id) => (id === RESOLVED_ID ? startModule(settings, token) : undefined),
        transformIndexHtml: () => [{ tag: 'script', attrs: { type: 'module', src: `/@id/${MODULE_ID}` }, injectTo: 'body' }],
        configureServer(server) {
            if (options.ai) server.middlewares.use(FIX_PATH, fixMiddleware(server.config.root, token, () => serverOrigins(server)));
            if (options.mcp) addMCP(server, token);
        },
    };
}
