import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { seoAccessibilityTool, type RuleId, type SATOptions } from '../src/core/seoAccessibilityTool';
import { rules } from '../src/core/rules';
import { blend, isLargeText, parseColor } from '../src/core/rules/a11y/color-contrast';
import { collectInternalLinks } from '../src/core/rules/seo/link-broken';
import { headingOutline } from '../src/core/rules/headings';
import { GOOGLE_TYPES, NESTED_TYPES } from '../src/core/rules/seo/google-structured-data';
import googleExamples from './google-structured-data.json';

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

    it('warns on a missing main and duplicate page headers (WAI-ARIA "should")', async () => {
        render('<header></header><header></header>');
        const r = await runOnly(['landmarks']);
        expect([r.errors, r.warnings]).toEqual([0, 2]);
    });

    it('reports two visible <main> as an error (HTML "must not"), a hidden one is fine', async () => {
        render('<main></main><main hidden></main>');
        expect((await runOnly(['landmarks'])).errors + (await runOnly(['landmarks'])).warnings).toBe(0);
        render('<main></main><main></main>');
        expect((await runOnly(['landmarks'])).errors).toBe(1);
        render('<main></main><div role="main"></div>');
        expect((await runOnly(['landmarks'])).warnings).toBe(1);
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

    it('warns once on a skipped level (WCAG G141 is advisory)', async () => {
        render('<h1>A</h1><h3>B</h3>');
        const r = await runOnly(['heading-order', 'heading-levels']);
        expect([r.errors, r.warnings]).toEqual([0, 1]);
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

    it('warns on a missing h1; several h1 are valid HTML', async () => {
        render('<h2>A</h2>');
        const missing = await runOnly(['h1']);
        expect([missing.errors, missing.warnings]).toEqual([0, 1]);
        render('<h1>A</h1><h1>B</h1>');
        const multiple = await runOnly(['h1']);
        expect(multiple.issues).toEqual([]);
    });
});

describe('links', () => {
    it('reports empty hrefs (including href=""); <a> without href is a valid placeholder', async () => {
        render('<a href="">a</a><a href="#">b</a><a href="javascript:void(0)">c</a><a>d</a><a href="/ok">e</a>');
        const r = await runOnly(['link-href']);
        expect(r.errors).toBe(3);
        expect(r.warnings).toBe(0);
    });

    it('link-target-blank: target="_blank" implies noopener, only rel="opener" is reported', async () => {
        render('<a target="_blank" href="/a">a</a><a target="_blank" rel="noreferrer" href="/b">b</a><a target="_blank" rel="opener" href="/c">c</a>');
        const r = await runOnly(['link-target-blank']);
        expect(r.issues.map((i) => i.element?.textContent)).toEqual(['c']);
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

    it('link-target-blank, link-text and link-broken are off by default', () => {
        expect(rules.filter((rule) => rule.defaultOff).map((rule) => rule.id)).toEqual(['link-target-blank', 'link-text', 'link-broken']);
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

describe('SEO meta: no length limits (Google Search Central)', () => {
    it('does not report a long title or description', async () => {
        document.title = 'T'.repeat(120);
        document.head.innerHTML += `<meta name="description" content="${'D'.repeat(300)}"><meta name="viewport" content="width=device-width">`;
        expect((await runOnly(['seo-meta'])).issues).toEqual([]);
    });
});

describe('html-lang: valid language tags (ACT bf051a, de46e4)', () => {
    it.each(['en', 'en-US', 'zh-Hant', 'es-419', 'de-CH-1996', 'gsw'])('accepts lang="%s"', async (lang) => {
        document.documentElement.setAttribute('lang', lang);
        render(`<p lang="${lang}">x</p><p lang="">y</p>`);
        expect((await runOnly(['html-lang'])).issues).toEqual([]);
    });

    it.each(['english', 'em', '#!', 'e'])('reports lang="%s" on <html> and on an element', async (lang) => {
        document.documentElement.setAttribute('lang', lang);
        render(`<p lang="${lang}">x</p>`);
        const r = await runOnly(['html-lang']);
        expect(r.issues.map((i) => i.wcag)).toEqual([['3.1.1'], ['3.1.2']]);
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
});

describe('structured-data: properties Google requires', () => {
    const jsonLd = (...items: unknown[]) => items.map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`).join('');
    const product = { '@context': 'https://schema.org', '@type': 'Product', name: 'Anvil', offers: { '@type': 'Offer', price: 0 } };

    it('the table is well formed', () => {
        for (const [type, entry] of Object.entries({ ...GOOGLE_TYPES, ...NESTED_TYPES })) {
            expect(entry.page, type).toMatch(/^https:\/\/developers\.google\.com\/search\/docs\/appearance\/structured-data\/[a-z-]+$/);
            expect(entry.updated, type).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(entry.required.length, type).toBeGreaterThan(0);
            entry.required.flat().forEach((path) => expect(path, type).toMatch(/^[A-Za-z]+(\.[A-Za-z]+)*$/));
            entry.notRequiredOnLast?.forEach((path) => expect(entry.required.flat(), type).toContain(path));
        }
    });

    it.each(Object.entries(googleExamples.examples))('Google examples are valid: %s', async (_, examples) => {
        render(jsonLd(...examples));
        const r = await runOnly(['structured-data']);
        expect(r.errorMessages).toEqual([]);
    });

    it('removing a required property from a Google example is an error that names it', async () => {
        let removed = 0;
        for (const item of Object.values(googleExamples.examples).flat() as Record<string, unknown>[]) {
            const requirements = GOOGLE_TYPES[item['@type'] as string];
            for (const [path] of requirements?.required.filter((alternatives) => alternatives.length === 1) ?? []) {
                const [property] = path.split('.');
                render(jsonLd({ ...item, [property]: undefined }));
                const r = await runOnly(['structured-data']);
                expect(r.errorMessages, `${item['@type']} without ${property}`).toEqual([expect.stringContaining(`Missing ${item['@type']} > ${path.split('.').join(' > ')}`)]);
                removed++;
            }
        }
        expect(removed).toBeGreaterThan(20);
    });

    it.each([
        ['Product name',{ ...product, name: undefined }, 'Missing Product > name'],
        ['Product review, rating or offer', { ...product, offers: undefined }, 'Missing Product > review, aggregateRating or offers'],
        ['offer price', { ...product, offers: [{ '@type': 'Offer', price: 1 }, { '@type': 'Offer', priceCurrency: 'EUR' }] }, 'Missing Product > offers[1] > price or priceSpecification > price'],
        ['aggregate rating count', { ...product, aggregateRating: { '@type': 'AggregateRating', ratingValue: 4 } }, 'Missing Product > aggregateRating > ratingCount or reviewCount'],
        ['review author', { ...product, review: { '@type': 'Review', reviewRating: { '@type': 'Rating', ratingValue: 4 } } }, 'Missing Product > review > author'],
        ['event address', { '@type': 'Event', name: 'A', startDate: '2026-11-01', location: { '@type': 'Place', name: 'B' } }, 'Missing Event > location > address'],
        ['video upload date', { '@type': 'VideoObject', name: 'A', thumbnailUrl: 'https://example.com/a.jpg' }, 'Missing VideoObject > uploadDate'],
        ['app price', { '@type': ['MobileApplication', 'Thing'], name: 'A', review: { '@type': 'Review', author: 'B' } }, 'Missing MobileApplication > offers > price'],
        ['business address', { '@type': 'https://schema.org/Restaurant', name: 'A' }, 'Missing Restaurant > address'],
    ])('reports a missing required property: %s', async (_, item, message) => {
        render(jsonLd(item));
        const r = await runOnly(['structured-data']);
        expect(r.errorMessages).toHaveLength(1);
        expect(r.errorMessages[0]).toContain(message);
        expect(r.errorMessages[0]).toContain('https://developers.google.com/search/docs/appearance/structured-data/');
    });

    it('breadcrumbs: every item but the last needs item; name may come from item', async () => {
        render(jsonLd({
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, item: { '@id': 'https://example.com/books', name: 'Books' } },
                { '@type': 'ListItem', position: 2, name: 'Fiction' },
                { '@type': 'ListItem', position: 3, name: 'Award winners' },
            ],
        }));
        const r = await runOnly(['structured-data']);
        expect(r.errorMessages).toEqual([expect.stringContaining('Missing BreadcrumbList > itemListElement[1] > item')]);
    });

    it('nodes with the same @id are merged across @graph and blocks', async () => {
        render(jsonLd(
            { '@context': 'https://schema.org', '@graph': [{ '@type': 'Product', '@id': '#p', name: 'Anvil', offers: { '@id': '#o' } }, { '@id': '#p', image: 'a.png' }] },
            { '@type': 'Offer', '@id': '#o' },
        ));
        const r = await runOnly(['structured-data']);
        expect(r.errorMessages).toEqual([expect.stringContaining('Missing Product > offers > price')]);
    });

    it('types Google requires nothing for, unknown types and Event offers are not checked', async () => {
        render(jsonLd(
            { '@type': 'Article' }, { '@type': 'Organization' }, { '@type': 'WebSite' },
            { '@type': 'Event', name: 'A', startDate: '2026-11-01', location: { '@type': 'Place', address: 'B' }, offers: { '@type': 'Offer' } },
        ));
        const r = await runOnly(['structured-data']);
        expect(r.errorMessages).toEqual([]);
    });
});

describe('SEO: contents (mixed content)', () => {

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

describe('aria-attributes (ACT 5f99a7, 6a7281, 4e8ab6, 5c01ea, kb1m8s)', () => {
    it('accepts valid states and properties, native states and unknown roles', async () => {
        render(`
            <button aria-pressed="false" aria-expanded="true">a</button>
            <input type="checkbox" role="switch" aria-label="Wi-Fi">
            <div role="combobox" aria-expanded="false" aria-controls="x" aria-label="c"></div>
            <div aria-live="polite" aria-busy="true">b</div>
            <h2 aria-level="2">c</h2><div role="heading" aria-level="3">d</div>
            <a href="/" aria-current="page">Home</a>
            <img src="a.png" alt="" aria-label="Logo">
            <section role="doc-chapter" aria-posinset="1">e</section>
            <table role="grid"><tr><td aria-selected="true">f</td></tr></table>
            <button role="none" aria-label="Close">x</button>`);
        expect((await runOnly(['aria-attributes'])).issues.map((i) => i.message)).toEqual([]);
    });

    it('reports unknown attributes, invalid values, missing required states and attributes not allowed', async () => {
        render(`
            <div role="checkbox" aria-not-checked="true">a</div>
            <div role="button" aria-expanded="collapsed">b</div>
            <div role="slider" aria-valuenow="1" aria-valuemin="one">c</div>
            <button aria-sort="ascending">d</button>
            <span aria-label="Warning">!</span>`);
        expect((await runOnly(['aria-attributes'])).errorMessages).toEqual([
            'Unknown ARIA attribute aria-not-checked on <div> "a". Check the spelling.',
            'role="checkbox" requires aria-checked, missing on <div> "a".',
            'Invalid value aria-expanded="collapsed" on <div> "b": use one of true, false, undefined.',
            'Invalid value aria-valuemin="one" on <div> "c": use a number.',
            'aria-sort is not supported by role button on <button> "d". Remove it or change the role.',
            'aria-label is not allowed on <span> "!" (role generic): this role can\'t be named. Remove it, or use an element or role that can.',
        ]);
    });

    it('requires aria-valuenow only on a focusable separator, and skips hidden elements', async () => {
        render('<div role="separator"></div><div role="checkbox" hidden></div><div role="separator" tabindex="0"></div>');
        expect((await runOnly(['aria-attributes'])).errors).toBe(1);
    });
});

describe('aria-hidden-focus (ACT 6cfa84)', () => {
    it('reports what is reachable with Tab inside aria-hidden="true", aria-hidden="false" included', async () => {
        render(`
            <div aria-hidden="true"><a href="/" id="a">a</a><div aria-hidden="false"><button id="b">b</button></div></div>
            <p tabindex="0" aria-hidden="true" id="c">c</p>`);
        expect((await runOnly(['aria-hidden-focus'])).issues.map((i) => i.element?.id)).toEqual(['a', 'b', 'c']);
    });

    it('accepts tabindex="-1", disabled, inert and hidden elements', async () => {
        render(`
            <div aria-hidden="true">
                <button tabindex="-1">a</button><input disabled><a href="/" style="display:none">b</a>
                <div inert><button>c</button></div><p>text</p>
            </div>
            <button aria-hidden="false">d</button><button aria-hidden>e</button>`);
        expect((await runOnly(['aria-hidden-focus'])).issues).toEqual([]);
    });
});

describe('meta-viewport and meta-refresh (ACT b4f0c3, bc659a)', () => {
    it.each(['width=device-width, initial-scale=1', 'maximum-scale=2.0', 'maximum-scale=-1', 'user-scalable=yes'])('accepts content="%s"', async (content) => {
        document.head.innerHTML = `<meta name="viewport" content="${content}">`;
        expect((await runOnly(['meta-viewport'])).issues).toEqual([]);
    });

    it.each(['user-scalable=no', 'width=device-width, maximum-scale=1', 'maximum-scale=1.5', 'user-scalable=0'])('reports content="%s"', async (content) => {
        document.head.innerHTML = `<meta name="viewport" content="${content}">`;
        expect((await runOnly(['meta-viewport'])).errors).toBe(1);
    });

    it('reports a timed refresh; immediate redirects, invalid values and 20 hours or more are fine', async () => {
        document.head.innerHTML = '<meta http-equiv="refresh" content="30; URL=\'/next\'">';
        expect((await runOnly(['meta-refresh'])).errorMessages[0]).toContain('after 30 s');
        for (const content of ['0; URL=/next', '72001', '+5', 'foo; 30', '']) {
            document.head.innerHTML = `<meta http-equiv="refresh" content="${content}">`;
            expect((await runOnly(['meta-refresh'])).issues).toEqual([]);
        }
    });

    it('meta-refresh lists 3.2.5 only at level AAA', async () => {
        document.head.innerHTML = '<meta http-equiv="refresh" content="5">';
        expect((await runOnly(['meta-refresh'])).issues[0].wcag).toEqual(['2.2.1']);
        expect((await runOnly(['meta-refresh'], { wcagLevel: 'AAA' })).issues[0].wcag).toEqual(['2.2.1', '3.2.5']);
    });
});

describe('iframe-name and accessible-name (ACT cae760, 2t702h, m6b1q3, ffd0e9, 8fc3b6)', () => {
    it('iframe-name: frames need title, aria-label or aria-labelledby; hidden and tabindex="-1" frames are skipped', async () => {
        render(`
            <iframe title="Map" src="a.html"></iframe><iframe aria-label="Video" src="b.html"></iframe>
            <iframe aria-hidden="true" src="c.html"></iframe><iframe tabindex="-1" src="d.html"></iframe>
            <iframe role="presentation" src="e.html"></iframe>
            <iframe name="Map" src="f.html"></iframe><iframe title=" " src="g.html"></iframe>`);
        expect((await runOnly(['iframe-name'])).errors).toBe(2);
    });

    it('reports an empty summary, empty headings and unnamed objects showing an image', async () => {
        render(`
            <details><summary></summary><p>x</p></details>
            <details><summary>Opening times</summary><summary></summary></details>
            <h2><img src="a.png" alt=""></h2><h3><span aria-hidden="true">Hidden</span></h3><h4>Title</h4>
            <div role="heading" aria-level="2"></div><h2 aria-hidden="true"></h2>
            <object data="logo.png"></object><object data="logo.png" title="Logo"></object><object data="page.html"></object>`);
        const r = await runOnly(['accessible-name']);
        expect(r.issues.map((i) => i.element?.tagName)).toEqual(['SUMMARY', 'H2', 'H3', 'DIV', 'OBJECT']);
        expect(r.issues.find((i) => i.element?.tagName === 'H2')?.wcag).toEqual([]);
    });

    it('a button whose only text is aria-hidden has no name; labelledby can point to hidden text', async () => {
        render('<button><span aria-hidden="true">×</span></button><span id="l" hidden>Close</span><button aria-labelledby="l"></button>');
        expect((await runOnly(['accessible-name'])).errors).toBe(1);
    });
});

describe('autocomplete-valid (ACT 73f2c2)', () => {
    it.each(['shipping email', 'off', 'on', 'section-a billing work tel', 'Street-Address', 'current-password webauthn', ''])('accepts autocomplete="%s"', async (value) => {
        render(`<input autocomplete="${value}">`);
        expect((await runOnly(['autocomplete-valid'])).issues).toEqual([]);
    });

    it.each(['mail', 'work photo', 'work shipping email', 'shipping', 'email invalid', 'work,email'])('reports autocomplete="%s"', async (value) => {
        render(`<input autocomplete="${value}">`);
        expect((await runOnly(['autocomplete-valid'])).errors).toBe(1);
    });

    it('skips disabled, hidden and button inputs', async () => {
        render('<input autocomplete="mail" disabled><input autocomplete="mail" aria-disabled="true"><input type="hidden" autocomplete="mail"><input type="submit" autocomplete="mail"><input autocomplete="mail" style="display:none">');
        expect((await runOnly(['autocomplete-valid'])).issues).toEqual([]);
    });
});

describe('label-in-name (ACT 2ee8b8)', () => {
    it('accepts a name that contains the visible label', async () => {
        render(`
            <button aria-label="Invia modulo">Invia</button><a href="/" aria-label="act Rules">ACT rules</a>
            <button aria-label="Search by date">Search by date (YYYY-MM-DD)</button><button aria-label="Close">X</button>
            <button aria-label="Next">Next…</button><nav aria-label="Main">Menu</nav>`);
        expect((await runOnly(['label-in-name'])).issues).toEqual([]);
    });

    it('reports a name without the visible label, or with its words out of order', async () => {
        render(`
            <button aria-label="Chiudi">Invia</button><a href="/" aria-label="Discover Italy">Discover It</a>
            <button aria-label="Download the specification">Download specification</button>
            <a href="/" aria-label="Download specification">Download <span aria-hidden="true">gizmo</span> specification</a>`);
        expect((await runOnly(['label-in-name'])).errors).toBe(4);
    });
});

describe('table-headers (ACT a25f45, d0f69e)', () => {
    it('accepts headers that point to cells of the same table and headers with cells', async () => {
        render(`
            <table><tr><th id="h1">Projects</th><th id="h2">Exams</th></tr><tr><td headers="h1">1</td><td headers="h2">2</td></tr></table>
            <table><tr><th>Day</th><th>Morning</th></tr><tr><th>Mon</th><td>8-12</td></tr></table>
            <table role="presentation"><tr><th>Layout</th></tr></table>`);
        expect((await runOnly(['table-headers'])).issues).toEqual([]);
    });

    it('reports headers pointing elsewhere and a header with an empty column', async () => {
        render(`
            <table><tr><th id="a">A</th></tr><tr><td id="self" headers="a self missing">1</td></tr></table>
            <table><tr><th>Rate</th><th>Value</th></tr><tr><td>15%</td></tr></table>`);
        const r = await runOnly(['table-headers']);
        expect(r.errorMessages).toHaveLength(2);
        expect(r.errorMessages[0]).toContain('"self", "missing"');
        expect(r.errorMessages[1]).toContain('Value');
    });
});

describe('media-autoplay (ACT 80f0bf)', () => {
    it('warns on media playing on their own with sound and no controls', async () => {
        render(`
            <video autoplay src="a.mp4" id="v"></video><audio autoplay src="a.mp3" id="a"></audio>
            <video autoplay muted src="b.mp4"></video><audio autoplay controls src="b.mp3"></audio>
            <video autoplay src="c.mp4#t=8,10"></video><video src="d.mp4"></video>`);
        const r = await runOnly(['media-autoplay']);
        expect([r.errors, r.warnings]).toEqual([0, 2]);
    });
});

describe('target-size outside the browser', () => {
    it('reports nothing without layout (jsdom)', async () => {
        render('<button>a</button><button>b</button>');
        expect((await runOnly(['target-size'])).issues).toEqual([]);
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
