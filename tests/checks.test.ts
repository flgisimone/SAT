import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSatLogStats, resetSatLogStats } from '../src/sat/satLogger';
import { highlight } from '../src/sat/satDom';
import { satReset } from '../src/sat/satReset';
import { blend, isLargeText, parseColor } from '../src/core/accessibilityA11y/colorContrastChecker';
import { checkAriaRolesWithSuggestions, checkUniqueLandmarks } from '../src/core/accessibilityA11y/ariaRolesChecker';
import { checkAriaLabel } from '../src/core/accessibilityA11y/ariaLabelChecker';
import { checkInputLabels } from '../src/core/accessibilityA11y/inputLabelChecker';
import { checkImageAlt } from '../src/core/accessibilityA11y/imageAltChecker';
import { checkH1, checkHeadingOrder, checkJumpLevels } from '../src/core/improvedHeadingControl/improvedHeadingControl';
import { checkEmptyLinks } from '../src/core/improvedLinksControl/emptyLinksChecker';
import { checkNonDescriptiveLinks } from '../src/core/improvedLinksControl/nonDescriptiveLinksChecker';
import { collectInternalLinks } from '../src/core/improvedLinksControl/brokenInternalLinksChecker';
import { checkHtmlLang, checkSeoMeta } from '../src/core/seo/seoMetaChecker';
import { satOptions } from '../src/sat/satOptions';

function render(html: string) {
    document.body.innerHTML = html;
}

const stats = () => getSatLogStats();

beforeEach(() => {
    satReset();
    resetSatLogStats();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('lang');
});

describe('highlight / satReset', () => {
    it('restores the original inline styles and title of the host page', () => {
        render('<p id="p" style="outline: 1px solid blue; background-color: yellow" title="original">x</p><span id="s">y</span>');
        const p = document.getElementById('p')!;
        const s = document.getElementById('s')!;
        const originalOutline = p.style.outline;

        highlight(p, { outline: '2px solid red', backgroundColor: 'pink', title: 'SAT' });
        highlight(p, { outline: '3px dashed red' });
        highlight(s, { title: 'SAT' });
        satReset();

        expect(p.style.outline).toBe(originalOutline);
        expect(p.style.backgroundColor).toBe('yellow');
        expect(p.getAttribute('title')).toBe('original');
        expect(s.hasAttribute('title')).toBe(false);
    });

    it('never touches SAT UI elements', () => {
        render('<div data-sat-ignore="true"><button id="b">x</button></div>');
        const b = document.getElementById('b')!;
        highlight(b, { outline: '2px solid red' });
        expect(b.style.outline).toBe('');
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
    it('does not report native elements without a role', () => {
        render('<header></header><nav><ul><li><a href="/">Home</a></li></ul></nav><main><button>Ok</button></main>');
        checkAriaRolesWithSuggestions(true);
        expect(stats().errors).toBe(0);
        expect(stats().warnings).toBe(0);
    });

    it('reports invalid and redundant roles', () => {
        render('<div role="foo"></div><button role="button">Ok</button><div role="button" tabindex="0">Ok</div>');
        checkAriaRolesWithSuggestions(true);
        expect(stats().errors).toBe(1);
        expect(stats().warnings).toBe(1);
    });
});

describe('landmarks', () => {
    it('ignores header/footer inside articles', () => {
        render('<header></header><main><article><header></header><footer></footer></article></main><footer></footer>');
        checkUniqueLandmarks(true);
        expect(stats().errors).toBe(0);
    });

    it('reports a missing main and duplicate page headers', () => {
        render('<header></header><header></header>');
        checkUniqueLandmarks(true);
        expect(stats().errors).toBe(2);
    });
});

describe('accessible names', () => {
    it('accepts buttons named by aria-label, text or labelled image', () => {
        render('<button aria-label="Close"><svg></svg></button><button>Save</button><a href="/"><img src="l.png" alt="Home"></a>');
        checkAriaLabel(true);
        expect(stats().errors).toBe(0);
    });

    it('reports unnamed buttons and links', () => {
        render('<button><svg></svg></button><a href="/x"><img src="x.png" alt=""></a>');
        checkAriaLabel(true);
        expect(stats().errors).toBe(2);
    });

    it('labels: hidden/submit inputs are ignored, unlabeled fields reported once', () => {
        render(`
            <input type="hidden" name="csrf">
            <input type="submit" value="Send">
            <label for="a">Name</label><input id="a">
            <label>Email <input type="email"></label>
            <input placeholder="Search">
        `);
        checkInputLabels(true);
        checkAriaLabel(true);
        expect(stats().errors).toBe(1);
        expect(stats().errorMessages[0]).toContain('placeholder');
    });

    it('does not throw on ids with quotes', () => {
        render('<input id=\'a"b\'>');
        expect(() => checkInputLabels(true)).not.toThrow();
    });
});

describe('images', () => {
    it('reports missing alt but accepts decorative images', () => {
        render('<img src="a.png"><img src="b.png" alt=""><img src="c.png" alt="Logo"><img src="d.png" alt="photo.jpg">');
        checkImageAlt(true);
        expect(stats().errors).toBe(1);
        expect(stats().warnings).toBe(1);
    });
});

describe('headings', () => {
    it('allows going back to a higher level (H3 -> H2)', () => {
        render('<h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2>');
        checkH1(true);
        checkHeadingOrder(true);
        checkJumpLevels(true);
        expect(stats().errors).toBe(0);
        expect(stats().warnings).toBe(0);
    });

    it('reports a skipped level once', () => {
        render('<h1>A</h1><h3>B</h3>');
        checkHeadingOrder(true);
        checkJumpLevels(true);
        expect(stats().errors).toBe(1);
    });

    it('reports missing and multiple h1', () => {
        render('<h2>A</h2>');
        checkH1(true);
        render('<h1>A</h1><h1>B</h1>');
        checkH1(true);
        expect(stats().errors).toBe(2);
    });
});

describe('links', () => {
    it('reports empty hrefs (including href="") and warns on missing href', () => {
        render('<a href="">a</a><a href="#">b</a><a href="javascript:void(0)">c</a><a>d</a><a href="/ok">e</a>');
        checkEmptyLinks(true);
        expect(stats().errors).toBe(3);
        expect(stats().warnings).toBe(1);
    });

    it('matches allowed link texts case-insensitively', () => {
        render('<a href="/a">Read more</a><a href="/b">Click here</a>');
        checkNonDescriptiveLinks(true, ['Read more']);
        expect(stats().warnings).toBe(1);
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

    it('is disabled by default', () => {
        expect(satOptions.enableCheckBrokenInternalLinks).toBe(false);
    });
});

describe('SEO meta', () => {
    it('reports missing lang, title and description', () => {
        document.title = '';
        checkHtmlLang(true);
        checkSeoMeta(true);
        expect(stats().errors).toBe(3);
        expect(stats().warnings).toBe(1); // viewport
    });

    it('passes on a complete head', () => {
        document.documentElement.setAttribute('lang', 'it');
        document.title = 'Home';
        document.head.innerHTML += '<meta name="description" content="Desc"><meta name="viewport" content="width=device-width">';
        checkHtmlLang(true);
        checkSeoMeta(true);
        expect(stats().errors).toBe(0);
        expect(stats().warnings).toBe(0);
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
    });
});
