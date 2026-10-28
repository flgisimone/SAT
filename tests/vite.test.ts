// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sat, type SATViteOptions } from '../src/integrations/vite';

const REPO = new URL('..', import.meta.url).pathname;

/** The module the plugin adds to the pages of `vite dev`, for a project in `root` (axe-core is installed in the repository). */
function startModule(options?: SATViteOptions, root?: string): string {
    const plugin = sat(options);
    if (root) (plugin.configResolved as (config: unknown) => void)({ root, logger: { info: () => undefined } });
    const resolve = plugin.resolveId as (id: string) => string;
    const load = plugin.load as (id: string) => string;
    return load(resolve('virtual:seo-accessibility-tool'));
}

describe('Vite plugin', () => {
    it('runs in vite dev only', () => {
        expect(sat().apply).toBe('serve');
    });

    it('starts the panel with the options of the plugin', () => {
        const code = startModule({ rules: { 'link-text': 'warning' } });
        // Without mcp and ai the panel suggests mcp.
        expect(code).toContain(`satChecker({ ...{"rules":{"link-text":"warning"}}, enabled: true, suggestMcp: true });`);
        expect(code).not.toContain('seo-accessibility-tool/axe');
    });

    it('adds the axe-core engine with axe: true', () => {
        const code = startModule({ axe: true });
        expect(code).toContain(`import { axe } from 'seo-accessibility-tool/axe';`);
        expect(code).toContain('satChecker({ ...{}, enabled: true, engines: [axe()], suggestMcp: true });');
    });

    it('turns axe-core on when the project has it, unless axe: false', () => {
        const empty = mkdtempSync(join(tmpdir(), 'sat-no-axe-'));
        try {
            expect(startModule({}, REPO)).toContain(`import { axe } from 'seo-accessibility-tool/axe';`);
            expect(startModule({}, empty)).not.toContain('seo-accessibility-tool/axe');
            expect(startModule({ axe: false }, REPO)).not.toContain('seo-accessibility-tool/axe');
        } finally {
            rmSync(empty, { recursive: true, force: true });
        }
    });

    it('with mcp: true the pages send their results, listen for sat:run and sat:status, and have the queue', () => {
        const code = startModule({ mcp: true });
        expect(code).toMatch(/mcp: \{ \.\.\.\{"url":"\/__sat\/results","queue":"\/__sat\/queue","token":"[0-9a-f-]{36}"\}, listen: \(run\) => import\.meta\.hot\?\.on\('sat:run', run\), status: \(show\) => import\.meta\.hot\?\.on\('sat:status', show\) \}/);
        expect(code).not.toContain('suggestMcp');
        expect(startModule({ ai: true })).not.toContain('suggestMcp');
        expect(startModule({})).not.toContain('mcp: {');
    });
});
