import { expect, test, type Page } from '@playwright/test';
import { rules } from '../../src/core/rules';
import type { RuleId } from '../../src/core/seoAccessibilityTool';
import { openPage } from './serve';

// F4-05: both rules need layout, so they are tested in Chromium only.

async function warnings(page: Page, body: string, rule: RuleId): Promise<string[]> {
    await openPage(page, `<!doctype html><html lang="en"><body style="margin:0">${body}</body></html>`);
    const only = { rules: Object.fromEntries(rules.map((r) => [r.id, r.id === rule ? undefined : 'off'])) };
    return page.evaluate(async (options) => {
        const { seoAccessibilityTool } = await import('/index.js');
        return (await seoAccessibilityTool(options)).warningMessages;
    }, only);
}

// A 1x1 image, so sizes come from attributes and CSS only.
const SRC = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

test.describe('image-size', () => {
    test('reports only images that can shift the layout', async ({ page }) => {
        const r = await warnings(page, `
            <img id="bare" src="${SRC}" alt="">
            <img id="one-side" src="${SRC}" width="100" alt="">
            <img src="${SRC}" width="100" height="50" alt="">
            <img src="${SRC}" style="width:100%;aspect-ratio:16/9" alt="">
            <img src="${SRC}" style="width:120px;height:80px" alt="">
            <img src="${SRC}" style="position:absolute;top:0" alt="">
            <img src="${SRC}" style="display:none" alt="">`, 'image-size');
        expect(r).toHaveLength(2);
        expect(r[0]).toContain('id="bare"');
        expect(r[1]).toContain('id="one-side"');
    });
});

test.describe('image-lazy-load', () => {
    test('reports lazy images in the first viewport, not below the fold or in a carousel', async ({ page }) => {
        const r = await warnings(page, `
            <img id="hero" src="${SRC}" width="200" height="100" loading="lazy" alt="">
            <img src="${SRC}" width="200" height="100" alt="">
            <div style="display:flex;width:100vw;overflow:hidden">
                <img src="${SRC}" width="200" height="100" style="flex:none;margin-left:200vw" loading="lazy" alt="">
            </div>
            <div style="height:3000px"></div>
            <img src="${SRC}" width="200" height="100" loading="lazy" alt="">`, 'image-lazy-load');
        expect(r).toHaveLength(1);
        expect(r[0]).toContain('id="hero"');
    });

    test('the result does not depend on the scroll position', async ({ page }) => {
        await warnings(page, '', 'image-lazy-load'); // opens the route
        const body = `<div style="height:3000px"></div><img id="below" src="${SRC}" width="200" height="100" loading="lazy" alt="">`;
        const only = { rules: Object.fromEntries(rules.map((r) => [r.id, r.id === 'image-lazy-load' ? undefined : 'off'])) };
        const r = await page.evaluate(async ({ html, options }) => {
            document.body.innerHTML = html;
            document.getElementById('below')!.scrollIntoView();
            const { seoAccessibilityTool } = await import('/index.js');
            return (await seoAccessibilityTool(options)).warningMessages;
        }, { html: body, options: only });
        expect(r).toHaveLength(0);
    });
});
