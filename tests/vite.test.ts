import { describe, expect, it } from 'vitest';
import { sat, type SATViteOptions } from '../src/integrations/vite';

/** The module the plugin adds to the pages of `vite dev`. */
function startModule(options?: SATViteOptions): string {
    const plugin = sat(options);
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
        expect(code).toContain(`satChecker({ ...{"rules":{"link-text":"warning"}}, enabled: true });`);
        expect(code).not.toContain('seo-accessibility-tool/axe');
    });

    it('adds the axe-core engine with axe: true', () => {
        const code = startModule({ axe: true });
        expect(code).toContain(`import { axe } from 'seo-accessibility-tool/axe';`);
        expect(code).toContain('satChecker({ ...{}, enabled: true, engines: [axe()] });');
    });
});
