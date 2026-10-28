// @vitest-environment node
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compareBaseline, readBaseline, writeBaseline } from '../src/headless/baseline';
import type { PageReport } from '../src/headless/report';

const issue = (id: string, severity: 'error' | 'warning' = 'error') => ({ id, ruleId: id.split(' ')[0], severity, category: 'accessibility' as const, message: id });
const page = (url: string, ids: string[]): PageReport => ({ url, issues: ids.map((id) => issue(id)), summary: { errors: ids.length, warnings: 0 } });

describe('baseline', () => {
    it('writes the ids by URL, keeping the other URLs, and reads them back', () => {
        const file = join(mkdtempSync(join(tmpdir(), 'sat-baseline-')), 'sat-baseline.json');
        expect(readBaseline(file)).toBeUndefined();

        writeBaseline(file, [page('http://localhost/', ['image-alt img'])], { 'http://localhost/old': ['h1'] });
        expect(readBaseline(file)).toEqual({ 'http://localhost/old': ['h1'], 'http://localhost/': ['image-alt img'] });
        expect(readFileSync(file, 'utf8').endsWith('\n')).toBe(true);

        writeFileSync(file, '["image-alt img"]');
        expect(() => readBaseline(file)).toThrow('is not a SAT baseline');
    });

    it('the issues out of the baseline are new; the ones that went away, fixed', () => {
        const baseline = { 'http://localhost/': ['image-alt img', 'h1'] };
        expect(compareBaseline(page('http://localhost/', ['image-alt img', 'h1']), baseline)).toEqual({ new: [], fixed: [] });

        const changes = compareBaseline(page('http://localhost/', ['image-alt img', 'link-text a']), baseline);
        expect(changes.new.map(({ id }) => id)).toEqual(['link-text a']);
        expect(changes.fixed).toEqual(['h1']);
        expect(compareBaseline(page('http://localhost/new', ['h1']), baseline).new).toHaveLength(1);
    });
});
