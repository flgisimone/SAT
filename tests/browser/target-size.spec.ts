import { expect, test, type Page } from '@playwright/test';
import { rules } from '../../src/core/rules';
import { openPage } from './serve';

// F9-03: target-size needs layout, so it is tested in Chromium only.

async function targetSizeErrors(page: Page, body: string): Promise<string[]> {
    await openPage(page, `<!doctype html><html lang="en"><body style="margin:40px">${body}</body></html>`);
    const only = { rules: Object.fromEntries(rules.map((r) => [r.id, r.id === 'target-size' ? undefined : 'off'])) };
    return page.evaluate(async (options) => {
        const { seoAccessibilityTool } = await import('/index.js');
        return (await seoAccessibilityTool(options)).errorMessages;
    }, only);
}

const SMALL = 'style="width:20px;height:20px;padding:0;border:0"';

test.describe('target-size (WCAG 2.5.8)', () => {
    test('an isolated 20×20 button passes through the spacing exception', async ({ page }) => {
        expect(await targetSizeErrors(page, `<button ${SMALL} aria-label="a"></button>`)).toEqual([]);
    });

    test('two adjacent 20×20 buttons are reported', async ({ page }) => {
        const errors = await targetSizeErrors(page, `<div style="display:flex"><button ${SMALL} aria-label="a"></button><button ${SMALL} aria-label="b"></button></div>`);
        expect(errors).toHaveLength(2);
        expect(errors[0]).toContain('20×20 px');
    });

    test('20×20 buttons 4 px apart are fine (circles of 24 px do not touch)', async ({ page }) => {
        expect(await targetSizeErrors(page, `<div style="display:flex;gap:4px"><button ${SMALL} aria-label="a"></button><button ${SMALL} aria-label="b"></button></div>`)).toEqual([]);
    });

    test('links in a sentence and native checkboxes are exceptions', async ({ page }) => {
        expect(await targetSizeErrors(page, `
            <p style="font-size:12px">Read the <a href="/a">terms</a> and the <a href="/b">privacy policy</a> before you continue.</p>
            <label><input type="checkbox"> A</label><label><input type="checkbox"> B</label>
            <div><input type="radio" name="r"><input type="radio" name="r"></div>`)).toEqual([]);
    });

    test('a list of small links with no text around them is reported', async ({ page }) => {
        const errors = await targetSizeErrors(page, `
            <ul style="list-style:none;margin:0;padding:0;font-size:10px;line-height:10px">
                <li><a href="/a">One</a></li><li><a href="/b">Two</a></li>
            </ul>`);
        expect(errors).toHaveLength(2);
    });
});

test('visually hidden skip links are not pointer targets', async ({ page }) => {
    expect(await targetSizeErrors(page, `
        <a href="#main" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);padding:8px">Skip</a>
        <a href="#main" style="position:absolute;clip:rect(0 0 0 0);padding:4px 8px;font-size:10px">Skip again</a>
        <a href="/" style="display:inline-block;font-size:10px">Home</a>`)).toEqual([]);
});
