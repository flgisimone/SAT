import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { seoAccessibilityTool, type RuleId, type SATOptions } from '../src/core/seoAccessibilityTool';
import { rules } from '../src/core/rules';
import { blend, isLargeText, parseColor } from '../src/core/rules/a11y/color-contrast';
import { collectInternalLinks } from '../src/core/rules/seo/link-broken';
import { headingOutline } from '../src/core/rules/headings';

function render(html: string) {
    document.body.innerHTML = html;
}

/** Runs only the given rules (turning on the ones that are off by default). */
function runOnly(ids: RuleId[], options: Partial<SATOptions> = {}, doc: Document = document) {
    const config = Object.fromEntries(
        rules.map((rule) => [rule.id, ids.includes(rule.id) ? (rule.defaultOff ? rule.defaultSeverity : undefined) : 'off'])
    );
    return seoAccessibilityTool({ ...options, rules: { ...config, ...options.rules } }, doc);
}

beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('lang');
});

describe('host page', () => {
    it('a run never changes the page', async () => {
        render('<main><h1 style="color: #ccc" title="t">A</h1><h1>B</h1><h4>C</h4><img src="a.png"><a href="#">x</a><button></button><div tabindex="2">y</div></main>');
        const before = document.documentElement.outerHTML;
        const r = await seoAccessibilityTool();
        expect(r.errors).toBeGreaterThan(3);
        expect(document.documentElement.outerHTML).toBe(before);
    });
});

describe('contrast helpers', () => {
    it('parses rgb, rgba, space syntax and hex', () => {
        expect(parseColor('rgb(255, 0, 0)')).toEqual([255, 0, 0, 1]);
        expect(parseColor('rgba(0, 0, 0, 0.5)')).toEqual([0, 0, 0, 0.5]);
        expect(parseColor('rgb(10 20 30 / 50%)')).toEqual([10, 20, 30, 0.5]);
        expect(parseColor('#fff')).toEqual([255, 255, 255, 1]);
        expect(parseColor('#00000080')![3]).toBeCloseTo(0.5, 2);
    });

    it('does not recurse forever on colors it cannot parse (e.g. oklch without canvas)', () => {
        expect(() => parseColor('oklch(0.7 0.1 200)')).not.toThrow();
    });

    it('blends semi-transparent colors over the background', () => {
        expect(blend([0, 0, 0, 0.5], [255, 255, 255])).toEqual([127.5, 127.5, 127.5]);
    });

    it('detects WCAG large text', () => {
        expect(isLargeText('24px', '400')).toBe(true);
        expect(isLargeText('19px', '700')).toBe(true);
        expect(isLargeText('19px', '400')).toBe(false);
    });
});

describe('ARIA roles', () => {
    it('does not report native elements without a role', async () => {
        render('<header></header><nav><ul><li><a href="/">Home</a></li></ul></nav><main><button>Ok</button></main>');
        const r = await runOnly(['aria-roles']);
        expect(r.errors).toBe(0);
        expect(r.warnings).toBe(0);
    });

    it('reports invalid and redundant roles', async () => {
        render('<div role="foo"></div><button role="button">Ok</button><div role="button" tabindex="0">Ok</div>');
        const r = await runOnly(['aria-roles']);
        expect(r.errors).toBe(1);
        expect(r.warnings).toBe(1);
    });
});

describe('landmarks', () => {
    it('ignores header/footer inside articles', async () => {
        render('<header></header><main><article><header></header><footer></footer></article></main><footer></footer>');
        expect((await runOnly(['landmarks'])).errors).toBe(0);
    });

    it('reports a missing main and duplicate page headers', async () => {
        render('<header></header><header></header>');
        expect((await runOnly(['landmarks'])).errors).toBe(2);
    });
});

describe('accessible names', () => {
    it('accepts buttons named by aria-label, text or labelled image', async () => {
        render('<button aria-label="Close"><svg></svg></button><button>Save</button><a href="/"><img src="l.png" alt="Home"></a>');
        expect((await runOnly(['accessible-name'])).errors).toBe(0);
    });

    it('reports unnamed buttons and links', async () => {
        render('<button><svg></svg></button><a href="/x"><img src="x.png" alt=""></a>');
        expect((await runOnly(['accessible-name'])).errors).toBe(2);
    });

    it('labels: hidden/submit inputs are ignored, unlabeled fields reported once', async () => {
        render(`
            <input type="hidden" name="csrf">
            <input type="submit" value="Send">
            <label for="a">Name</label><input id="a">
            <label>Email <input type="email"></label>
            <input placeholder="Search">
        `);
        const r = await runOnly(['form-label', 'accessible-name']);
        expect(r.errors).toBe(1);
        expect(r.errorMessages[0]).toContain('placeholder');
    });

    it('does not throw on ids with quotes', async () => {
        render('<input id=\'a"b\'>');
        const r = await runOnly(['form-label']);
        expect(r.errorMessages.join()).not.toContain('internal error');
    });
});

describe('hidden elements', () => {
    it('link-href, accessible-name and form-label skip what is hidden from assistive technologies', async () => {
        render(`
            <div style="display:none"><a href="#">a</a><button></button><input></div>
            <div hidden><a href="#">b</a></div>
            <nav style="visibility:hidden"><a href="javascript:void(0)">c</a><input></nav>
            <div aria-hidden="true"><button></button></div>
            <a href="#" style="opacity:0">still in the tree</a>`);
        const r = await runOnly(['link-href', 'accessible-name', 'form-label']);
        expect(r.errorMessages).toHaveLength(1);
        expect(r.errorMessages[0]).toContain('still in the tree');
    });
});

describe('images', () => {
    it('reports missing alt but accepts decorative images', async () => {
        render('<img src="a.png"><img src="b.png" alt=""><img src="c.png" alt="Logo"><img src="d.png" alt="photo.jpg">');
        const r = await runOnly(['image-alt']);
        expect(r.errors).toBe(1);
        expect(r.warnings).toBe(1);
    });
});

describe('headings', () => {
    it('allows going back to a higher level (H3 -> H2)', async () => {
        render('<h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2>');
        const r = await runOnly(['h1', 'heading-order', 'heading-levels']);
        expect(r.errors).toBe(0);
        expect(r.warnings).toBe(0);
    });

    it('reports a skipped level once', async () => {
        render('<h1>A</h1><h3>B</h3>');
        expect((await runOnly(['heading-order', 'heading-levels'])).errors).toBe(1);
    });

    it('outline: headings in page order with their levels and skipped levels', () => {
        render('<h1>Title</h1><h2> A  b </h2><h4>C</h4><h2>D</h2><h3>E</h3><div data-sat-ignore><h2>SAT</h2></div>');
        expect(headingOutline(document).map(({ level, text, skipped }) => [level, text, skipped])).toEqual([
            [1, 'Title', false],
            [2, 'A b', false],
            [4, 'C', true],
            [2, 'D', false],
            [3, 'E', false],
        ]);
    });

    it('reports missing and multiple h1', async () => {
        render('<h2>A</h2>');
        const missing = await runOnly(['h1']);
        render('<h1>A</h1><h1>B</h1>');
        const multiple = await runOnly(['h1']);
        expect(missing.errors + multiple.errors).toBe(2);
    });
});

describe('links', () => {
    it('reports empty hrefs (including href="") and warns on missing href', async () => {
        render('<a href="">a</a><a href="#">b</a><a href="javascript:void(0)">c</a><a>d</a><a href="/ok">e</a>');
        const r = await runOnly(['link-href']);
        expect(r.errors).toBe(3);
        expect(r.warnings).toBe(1);
    });

    it('matches allowed link texts case-insensitively', async () => {
        render('<a href="/a">Read more</a><a href="/b">Click here</a>');
        expect((await runOnly(['link-text'], { allowedLinkTexts: ['Read more'] })).warnings).toBe(1);
    });

    it('collects same-origin links once, skipping external, protocol-relative and logout URLs', () => {
        render(`
            <a href="/a">1</a><a href="/a#x">2</a>
            <a href="//cdn.example.com/x">3</a>
            <a href="https://other.example.com/">4</a>
            <a href="/logout">5</a>
            <a href="mailto:a@b.c">6</a>
        `);
        const links = collectInternalLinks();
        expect(links.size).toBe(1);
        expect([...links.values()][0]).toHaveLength(2);
    });

    it('link-text and link-broken are off by default', () => {
        expect(rules.filter((rule) => rule.defaultOff).map((rule) => rule.id)).toEqual(['link-text', 'link-broken']);
    });
});

describe('SEO meta', () => {
    it('reports missing lang, title and description', async () => {
        document.title = '';
        const r = await runOnly(['html-lang', 'seo-meta']);
        expect(r.errors).toBe(3);
        expect(r.warnings).toBe(1); // viewport
    });

    it('passes on a complete head', async () => {
        document.documentElement.setAttribute('lang', 'it');
        document.title = 'Home';
        document.head.innerHTML += '<meta name="description" content="Desc"><meta name="viewport" content="width=device-width">';
        const r = await runOnly(['html-lang', 'seo-meta']);
        expect(r.errors).toBe(0);
        expect(r.warnings).toBe(0);
    });
});

describe('SEO meta: duplicates', () => {
    it('reports a second <title> and meta description, not an SVG title', async () => {
        document.title = 'Home';
        document.head.innerHTML += '<title>Again</title><meta name="description" content="A"><meta name="description" content="B">';
        render('<svg><title>Icon</title></svg>');
        const r = await runOnly(['seo-meta']);
        expect(r.errorMessages).toEqual([
            '2 <title> elements found; keep only one.',
            '2 <meta name="description"> found; keep only one.',
        ]);
    });
});

/** A complete head: no indexing or sharing issue. */
const COMPLETE_HEAD = `
    <link rel="canonical" href="https://example.com/en/">
    <link rel="alternate" hreflang="en" href="https://example.com/en/">
    <link rel="alternate" hreflang="en-GB" href="https://example.com/uk/">
    <link rel="alternate" hreflang="x-default" href="https://example.com/">
    <meta name="robots" content="index, follow">
    <meta property="og:title" content="Home"><meta property="og:type" content="website">
    <meta property="og:image" content="https://example.com/a.png"><meta property="og:url" content="https://example.com/en/">
    <meta name="twitter:card" content="summary_large_image">
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"A"},{"@type":"WebSite"}]}</script>`;
const INDEXING: RuleId[] = ['canonical', 'robots-meta', 'social-meta', 'hreflang', 'structured-data'];

describe('SEO: indexing and sharing', () => {
    it('a complete head has no issues', async () => {
        document.head.innerHTML = COMPLETE_HEAD;
        const r = await runOnly(INDEXING);
        expect([...r.errorMessages, ...r.warningMessages]).toEqual([]);
    });

    it.each([
        ['missing canonical', '', 'warning', /Missing <link rel="canonical">/],
        ['two canonicals', '<link rel="canonical" href="https://a.com/"><link rel="canonical" href="https://b.com/">', 'error', /2 <link rel="canonical">/],
        ['empty canonical', '<link rel="canonical" href="">', 'error', /empty href/],
        ['relative canonical', '<link rel="canonical" href="/en/">', 'warning', /is relative/],
    ])('canonical: %s', async (_, head, severity, message) => {
        document.head.innerHTML = head;
        const r = await runOnly(['canonical']);
        const messages = severity === 'error' ? r.errorMessages : r.warningMessages;
        expect(r.errors + r.warnings).toBe(1);
        expect(messages[0]).toMatch(message);
    });

    it('robots: warns on noindex, nofollow and none', async () => {
        document.head.innerHTML = '<meta name="robots" content="noindex"><meta name="googlebot" content="NOFOLLOW"><meta name="robots" content="none">';
        const r = await runOnly(['robots-meta']);
        expect(r.errors).toBe(0);
        expect(r.warnings).toBe(4);
    });

    it('social: lists the missing Open Graph properties, relative URLs and the Twitter card', async () => {
        document.head.innerHTML = '<meta property="og:title" content="Home"><meta property="og:image" content="/a.png">';
        const r = await runOnly(['social-meta']);
        expect(r.warningMessages).toEqual([
            'Missing Open Graph <meta property="og:type">, <meta property="og:url">: link previews may be incomplete.',
            '<meta property="og:image" content="/a.png"> must be an absolute URL (https://…).',
            'Missing <meta name="twitter:card"> (e.g. "summary_large_image"): X shows no card without it.',
        ]);
    });

    it('hreflang: invalid code, relative URL and two URLs for one language', async () => {
        document.head.innerHTML = `
            <link rel="alternate" hreflang="english" href="https://example.com/en/">
            <link rel="alternate" hreflang="it" href="/it/">
            <link rel="alternate" hreflang="de" href="https://example.com/de/">
            <link rel="alternate" hreflang="DE" href="https://example.com/de-2/">
            <link rel="alternate" hreflang="es-419" href="https://example.com/es/">
            <link rel="alternate" hreflang="zh-Hant-TW" href="https://example.com/tw/">`;
        const r = await runOnly(['hreflang']);
        expect(r.errorMessages).toHaveLength(3);
        expect(r.errorMessages[0]).toContain('"english" is not a language code');
        expect(r.errorMessages[1]).toContain('relative URL "/it/"');
        expect(r.errorMessages[2]).toContain('points to both');
    });
});

describe('SEO: contents', () => {
    it('malformed JSON-LD is an error with the parse position', async () => {
        render('<script type="application/ld+json">{"@type": "Organization",}</script>');
        const r = await runOnly(['structured-data']);
        expect(r.errors).toBe(1);
        expect(r.errorMessages[0]).toMatch(/Invalid JSON-LD .*position 25/);
    });

    it('JSON-LD items without @type are an error', async () => {
        render('<script type="application/ld+json">[{"@type":"Person"},{"name":"x"}]</script><script type="application/ld+json">{"@graph":[{"name":"y"}]}</script>');
        const r = await runOnly(['structured-data']);
        expect(r.errorMessages).toHaveLength(2);
        expect(r.errorMessages[0]).toContain('1 item(s) without "@type"');
    });

    it('mixed content: active resources are errors, images warnings, links and http pages ignored', async () => {
        const html = `<!doctype html><head>
            <link rel="stylesheet" href="http://cdn.example.com/a.css"><link rel="alternate" hreflang="en" href="http://example.com/">
            </head><body>
            <script src="http://cdn.example.com/a.js"></script>
            <img src="https://example.com/ok.png"><img srcset="https://example.com/a.png 1x, http://example.com/b.png 2x">
            <a href="http://example.com/">page</a><iframe src="//example.com/protocol-relative"></iframe></body>`;
        const secure = await runOnly(['mixed-content'], {}, new JSDOM(html, { url: 'https://example.com/' }).window.document);
        expect(secure.errors).toBe(2);
        expect(secure.warnings).toBe(1);
        expect(secure.warningMessages[0]).toContain('http://example.com/b.png');

        const plain = await runOnly(['mixed-content'], {}, new JSDOM(html, { url: 'http://example.com/' }).window.document);
        expect(plain.errors + plain.warnings).toBe(0);
    });
});

describe('Vue integration', () => {
    it('starts immediately when called outside a component', async () => {
        vi.resetModules();
        const satChecker = vi.fn();
        vi.doMock('../src/sat/satChecker', () => ({ satChecker }));
        window.__SAT_INIT__ = false;
        const { useSatChecker } = await import('../src/integrations/vue');
        useSatChecker({ enableCheckH1: false });
        expect(satChecker).toHaveBeenCalledWith({ enableCheckH1: false });
        vi.doUnmock('../src/sat/satChecker');
    });
});
