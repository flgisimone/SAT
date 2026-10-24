import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runSAT, seoAccessibilityTool } from '../src/core/seoAccessibilityTool';
import { rules } from '../src/core/rules';
import { cssSelector } from '../src/sat/issue';
import { LEGACY_OPTIONS, type LegacyOptions } from '../src/sat/satOptions';

beforeEach(() => {
    document.body.innerHTML = '';
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Issue', () => {
    it('has rule, severity, category, message, WCAG criteria and the element', async () => {
        document.body.innerHTML = '<main><img src="a.png"></main>';
        const { issues } = await seoAccessibilityTool();
        const issue = issues.find((i) => i.ruleId === 'image-alt')!;

        expect(issue).toMatchObject({ severity: 'error', category: 'a11y', wcag: ['1.1.1'] });
        expect(issue.message).toContain('alt');
        expect(issue.element).toBe(document.querySelector('img'));
        expect(issue.help).toBe('https://github.com/flgisimone/SAT/blob/develop/docs/rules/image-alt.md');
    });

    it('every rule of the registry has its documentation page, and every page a rule', () => {
        const docs = 'docs/rules';
        expect(rules.filter((rule) => !existsSync(`${docs}/${rule.id}.md`)).map((rule) => rule.id)).toEqual([]);
        expect(readdirSync(docs).sort()).toEqual(rules.map((rule) => `${rule.id}.md`).sort());
    });

    it('every rule page cites an official source (W3C, WHATWG, Google, Open Graph, X)', () => {
        const official = /\(https:\/\/(www\.w3\.org|html\.spec\.whatwg\.org|developers\.google\.com|web\.dev|ogp\.me|developer\.x\.com)\//;
        const missing = rules.filter((rule) => {
            const source = readFileSync(`docs/rules/${rule.id}.md`, 'utf8').split('\n').find((line) => line.startsWith('**Source**: '));
            return !source || !official.test(source);
        });
        expect(missing.map((rule) => rule.id)).toEqual([]);
    });

    it.each([
        ['unique id', '<div><p id="target">x</p></div>'],
        ['duplicated id', '<p id="dup">a</p><p id="dup"><span>b</span><span id="target-inner">c</span></p>'],
        ['siblings with the same tag', '<ul><li>a</li><li><a>b</a></li><li><a>c</a></li></ul>'],
        ['id with quotes', '<section id=\'a"b\'><p>x</p><p>y</p></section>'],
    ])('the selector matches only the element (%s)', (_, html) => {
        document.body.innerHTML = html;
        for (const el of document.body.querySelectorAll('*')) {
            const matches = document.querySelectorAll(cssSelector(el));
            expect(matches).toHaveLength(1);
            expect(matches[0]).toBe(el);
        }
    });
});

describe('rule registry', () => {
    it('has the 36 rules with unique ids', () => {
        const ids = rules.map((rule) => rule.id);
        expect(ids).toHaveLength(36);
        expect(new Set(ids).size).toBe(36);
    });

    it('a failing rule becomes an issue and the others still run', async () => {
        vi.spyOn(rules.find((r) => r.id === 'h1')!, 'run').mockImplementation(() => {
            throw new Error('boom');
        });
        document.body.innerHTML = '<img src="a.png">';
        const { issues } = await seoAccessibilityTool();

        expect(issues.find((i) => i.ruleId === 'h1')?.message).toBe('SAT internal error in h1: boom');
        expect(issues.some((i) => i.ruleId === 'image-alt')).toBe(true);
    });
});

describe('rules option', () => {
    beforeEach(() => {
        document.body.innerHTML = '<img src="a.png"><img src="b.png" alt="photo.jpg"><a target="_blank" rel="opener" href="/x">x</a>';
    });

    const ofRule = async (id: string, options = {}) =>
        (await seoAccessibilityTool(options)).issues.filter((i) => i.ruleId === id).map((i) => i.severity);

    it('a severity applies to every issue of the rule', async () => {
        expect(await ofRule('image-alt')).toEqual(['error', 'warning']);
        expect(await ofRule('image-alt', { rules: { 'image-alt': 'warning' } })).toEqual(['warning', 'warning']);
        expect(await ofRule('link-target-blank', { rules: { 'link-target-blank': 'error' } })).toEqual(['error']);
    });

    it("'off' turns the rule off", async () => {
        expect(await ofRule('image-alt', { rules: { 'image-alt': 'off' } })).toEqual([]);
    });

    it('wins over the 1.x option', async () => {
        expect(await ofRule('image-alt', { enableCheckImageAlt: false, rules: { 'image-alt': 'warning' } })).toHaveLength(2);
        expect(await ofRule('image-alt', { enableCheckImageAlt: true, rules: { 'image-alt': 'off' } })).toEqual([]);
    });

    it('counts and 1.x message lists follow the severity', async () => {
        const r = await seoAccessibilityTool({ rules: { 'image-alt': 'warning' } });
        expect(r.errors).toBe(r.errorMessages.length);
        expect(r.warnings).toBe(r.warningMessages.length);
        expect(r.errors + r.warnings).toBe(r.issues.length);
        expect(r.errorMessages.join()).not.toContain('alt attribute');
    });
});

describe('1.x enableCheck* options', () => {
    it.each(Object.entries(LEGACY_OPTIONS))('%s controls the rule %s', async (key, id) => {
        const spies = rules.map((rule) => vi.spyOn(rule, 'run').mockImplementation(() => undefined));
        const target = spies[rules.findIndex((rule) => rule.id === id)];

        await seoAccessibilityTool({ [key as keyof LegacyOptions]: false });
        expect(target).not.toHaveBeenCalled();

        await seoAccessibilityTool({ [key as keyof LegacyOptions]: true });
        expect(target).toHaveBeenCalledTimes(1);
    });

    it('without options, all rules run but link-target-blank, link-text and link-broken', async () => {
        const spies = rules.map((rule) => vi.spyOn(rule, 'run').mockImplementation(() => undefined));
        await seoAccessibilityTool();
        const ran = rules.filter((_, i) => spies[i].mock.calls.length > 0).map((rule) => rule.id);
        expect(ran).toEqual(rules.map((rule) => rule.id).filter((id) => !['link-target-blank', 'link-text', 'link-broken'].includes(id)));
    });
});

describe('run context', () => {
    it('two overlapping runs on different documents keep separate results', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
            await new Promise((resolve) => setTimeout(resolve, String(url).endsWith('/a') ? 20 : 5));
            return new Response(null, { status: 404 });
        });

        const page = (path: string) => {
            const doc = document.implementation.createHTMLDocument('x');
            doc.body.innerHTML = `<a href="${path}">link</a>`;
            return doc;
        };
        const only = { rules: Object.fromEntries(rules.map((rule) => [rule.id, rule.id === 'link-broken' ? 'error' : 'off'])) };

        const [a, b] = await Promise.all([
            seoAccessibilityTool(only, page('/a')),
            seoAccessibilityTool(only, page('/b')),
        ]);

        expect(a.issues.map((i) => i.message)).toEqual([expect.stringContaining('/a (status 404)')]);
        expect(b.issues.map((i) => i.message)).toEqual([expect.stringContaining('/b (status 404)')]);
    });
});

describe('enabled option', () => {
    beforeEach(() => {
        vi.resetModules();
        document.querySelector('sat-panel')?.remove();
        vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }); // not in jsdom
    });

    it('true starts the controller without NODE_ENV, false never does', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        const off = await import('../src/sat/satChecker');
        off.satChecker({ enabled: false });
        expect(document.querySelector('sat-panel')).toBeNull();

        vi.stubEnv('NODE_ENV', 'production');
        vi.resetModules();
        const on = await import('../src/sat/satChecker');
        on.satChecker({ enabled: true });
        expect(document.querySelector('sat-panel')).not.toBeNull();
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });
});

describe('runSAT', () => {
    it('returns issues and summary that survive JSON.stringify, with selectors and messages', async () => {
        document.body.innerHTML = '<main><img id="photo" src="a.png"></main>';
        const report = await runSAT();
        const parsed = JSON.parse(JSON.stringify(report));

        expect(parsed).toEqual(report);
        expect(parsed.issues.every((issue: object) => !('element' in issue))).toBe(true);
        expect(parsed.issues.find((issue: { ruleId: string }) => issue.ruleId === 'image-alt')).toMatchObject({ selector: '[id="photo"]', message: expect.stringContaining('alt') });
        const errors = parsed.issues.filter((issue: { severity: string }) => issue.severity === 'error').length;
        expect(parsed.summary).toEqual({ errors, warnings: parsed.issues.length - errors });
    });
});
