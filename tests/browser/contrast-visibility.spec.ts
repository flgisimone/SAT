import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// Runs the built bundle (dist/index.js) in a real browser, where layout,
// computed styles and canvas are available (unlike happy-dom).
const bundle = readFileSync(new URL('../../dist/index.js', import.meta.url), 'utf8')
    .replace(/export\s*\{\s*seoAccessibilityTool\s*\};?\s*$/m, 'window.seoAccessibilityTool = seoAccessibilityTool;');

const ONLY = (rule: string) => ({
    enableCheckH1: false,
    enableCheckH1Visible: false,
    enableCheckHeadingOrder: false,
    enableCheckJumpLevels: false,
    enableCheckTextElementContrast: false,
    enableCheckAriaLabel: false,
    enableCheckAriaRolesWithSuggestions: false,
    enableCheckUniqueLandmarks: false,
    enableCheckInputLabel: false,
    enableCheckFocusManagement: false,
    enableCheckImageAlt: false,
    enableCheckEmptyLinks: false,
    enableCheckExternalLinksRel: false,
    enableCheckTabindexNegativeOne: false,
    enableCheckNonDescriptiveLinks: false,
    enableCheckBrokenInternalLinks: false,
    enableCheckHtmlLang: false,
    enableCheckSeoMeta: false,
    [rule]: true,
});

type Result = { errors: number; warnings: number; errorMessages: string[]; warningMessages: string[] };

async function run(page: Page, body: string, rule: string): Promise<Result> {
    await page.setContent(`<!doctype html><html lang="en"><body>${body}</body></html>`);
    await page.addScriptTag({ content: bundle, type: 'module' });
    await page.waitForFunction(() => 'seoAccessibilityTool' in window);
    return page.evaluate((options) => (window as any).seoAccessibilityTool(options), ONLY(rule));
}

const contrast = 'enableCheckTextElementContrast';

test.describe('contrast', () => {
    test('black on white passes', async ({ page }) => {
        const r = await run(page, '<p style="color:#000;background:#fff">Text</p>', contrast);
        expect(r.errors).toBe(0);
        expect(r.warnings).toBe(0);
    });

    test('oklch colors (Tailwind v4) are parsed instead of crashing', async ({ page }) => {
        // oklch(0.85 0 0) is a light gray: about 1.6:1 on white
        const r = await run(page, '<p style="color:oklch(0.85 0 0)">Light gray</p>', contrast);
        expect(r.errorMessages.join('\n')).not.toContain('internal error');
        expect(r.errors).toBe(1);
        expect(r.errorMessages[0]).toMatch(/ratio 1\.[0-9]{2}/);
    });

    test('semi-transparent background is blended with the one below', async ({ page }) => {
        // white text on black at 10% over white ≈ light gray background: too low
        const r = await run(
            page,
            '<div style="background:#fff"><p style="color:#fff;background:rgba(0,0,0,0.1)">Text</p></div>',
            contrast
        );
        expect(r.errors).toBe(1);
    });

    test('semi-transparent text color is blended', async ({ page }) => {
        const r = await run(page, '<p style="color:rgba(0,0,0,0.3)">Faded</p>', contrast);
        expect(r.errors).toBe(1);
    });

    test('large text uses the 3:1 AA threshold', async ({ page }) => {
        // #888 on white ≈ 3.54:1 — fails AA for normal text, passes AA for large text
        const normal = await run(page, '<p style="color:#888;font-size:16px">Small</p>', contrast);
        expect(normal.errors).toBe(1);

        const large = await run(page, '<p style="color:#888;font-size:24px">Large</p>', contrast);
        expect(large.errors).toBe(0);
        expect(large.warnings).toBe(1);
    });

    test('hidden text and background images are skipped', async ({ page }) => {
        const r = await run(
            page,
            `<p style="color:#eee;display:none">Hidden</p>
             <div style="background-image:linear-gradient(#000,#000)"><p style="color:#111">On image</p></div>`,
            contrast
        );
        expect(r.errors).toBe(0);
    });
});

test.describe('visibility', () => {
    test('hidden h1 is reported, visible h1 is not', async ({ page }) => {
        const hidden = await run(page, '<h1 style="display:none">Title</h1>', 'enableCheckH1Visible');
        expect(hidden.errors).toBe(1);

        const visible = await run(page, '<h1>Title</h1>', 'enableCheckH1Visible');
        expect(visible.errors).toBe(0);
    });

    test('position:fixed controls are treated as visible', async ({ page }) => {
        const r = await run(
            page,
            '<button style="position:fixed;top:0" tabindex="0">Fixed</button><div style="visibility:hidden"><button tabindex="0">Hidden</button></div>',
            'enableCheckFocusManagement'
        );
        expect(r.errors).toBe(1);
        expect(r.errorMessages[0]).toContain('Hidden');
    });
});
