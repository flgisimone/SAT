import { expect, test, type Page } from '@playwright/test';
import { rules } from '../../src/core/rules';
import type { RuleId, SATResult } from '../../src/core/seoAccessibilityTool';
import { openPage } from './serve';

// Runs the built bundle in a real browser, where layout, computed styles and canvas
// are available (unlike jsdom).

type Result = Omit<SATResult, 'issues'>;

async function run(page: Page, body: string, rule: RuleId, extra: object = {}): Promise<Result> {
    await openPage(page, `<!doctype html><html lang="en"><body>${body}</body></html>`);
    const only = { ...extra, rules: Object.fromEntries(rules.map((r) => [r.id, r.id === rule ? undefined : 'off'])) };
    return page.evaluate(async (options) => {
        const { seoAccessibilityTool } = await import('/index.js');
        const { errors, warnings, errorMessages, warningMessages } = await seoAccessibilityTool(options);
        return { errors, warnings, errorMessages, warningMessages };
    }, only);
}

const contrast = 'color-contrast';

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
        expect(large.warnings).toBe(0);
    });

    test('AAA (1.4.6) warnings only with wcagLevel: "AAA"', async ({ page }) => {
        // #6b6b6b on white ≈ 5.3:1 — meets AA, not AAA
        const text = '<p style="color:#6b6b6b;font-size:16px">Gray</p>';
        expect(await run(page, text, contrast)).toMatchObject({ errors: 0, warnings: 0 });
        expect(await run(page, text, contrast, { wcagLevel: 'AAA' })).toMatchObject({ errors: 0, warnings: 1 });
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
        const hidden = await run(page, '<h1 style="display:none">Title</h1>', 'h1-visible');
        expect(hidden.warnings).toBe(1);

        const visible = await run(page, '<h1>Title</h1>', 'h1-visible');
        expect(visible.warnings).toBe(0);
    });

    test('position:fixed controls are treated as visible', async ({ page }) => {
        const r = await run(
            page,
            '<button style="position:fixed;top:0" tabindex="0">Fixed</button><div style="visibility:hidden"><button tabindex="0">Hidden</button></div>',
            'focus-management'
        );
        expect(r.errors).toBe(1);
        expect(r.errorMessages[0]).toContain('Hidden');
    });
});

test.describe('accessible names in the browser', () => {
    test('content inside display: contents (e.g. <picture>) counts, display: none does not', async ({ page }) => {
        const r = await run(page, `
            <a href="/"><picture style="display:contents"><img src="logo.svg" alt="Home"></picture></a>
            <a href="/a" id="empty"><span style="display:none">Hidden</span></a>`, 'accessible-name');
        expect(r.errorMessages).toHaveLength(1);
        expect(r.errorMessages[0]).toContain('id="empty"');
    });
});

test.describe('label-in-name in the browser', () => {
    test('keyboard shortcuts, SVG masks, transparent, visually hidden and clipped copies are not part of the visible label', async ({ page }) => {
        const r = await run(page, `
            <button aria-label="Search">Search <kbd>⌘</kbd><kbd>K</kbd></button>
            <a href="/a" aria-label="Download specification">Download <span style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)">gizmo</span> specification</a>
            <a href="/b" aria-label="Sign in" style="display:inline-block;height:18px;line-height:18px;overflow:hidden"><span style="display:block">Sign in</span><span style="display:block">Sign in</span></a>
            <a href="/d" aria-label="Sign in"><svg width="60" height="20"><defs><mask id="m"><text x="0" y="15">Sign in</text></mask></defs><rect width="60" height="20" mask="url(#m)"/></svg><span style="opacity:0">Sign in</span></a>
            <a href="/c" aria-label="Sign in" id="wrong">Log in</a>`, 'label-in-name');
        expect(r.errorMessages).toHaveLength(1);
        expect(r.errorMessages[0]).toContain('id="wrong"');
    });
});
