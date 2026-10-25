// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The guides in docs/guides/ quote code that is tested elsewhere: these checks keep them in step.

const ROOT = join(__dirname, '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

describe('docs/guides', () => {
    it('ci.md has the workflow of examples/vite-vanilla, which npm run smoke runs', () => {
        expect(read('docs/guides/ci.md')).toContain(read('examples/vite-vanilla/.github/workflows/sat.yml'));
    });

    it('configuration.md names only options of the public types', () => {
        const types = ['src/sat/satOptions.ts', 'src/integrations/vite.ts', 'src/headless/playwright.ts'].map(read).join('\n');
        const table = read('docs/guides/configuration.md').split('## All the options')[1];
        const options = [...table.matchAll(/^\| `(\w+)` \|/gm)].map((match) => match[1]);

        expect(options.length).toBeGreaterThan(0);
        for (const option of options) expect(types, option).toMatch(new RegExp(`\\b${option}\\??:`));
    });
});
