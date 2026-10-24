import { expect, test } from '@playwright/test';
import { openPage } from './serve';

// F3-07: one run on a page of about 5,000 elements.

const SECTIONS = 850; // 6 elements each
// Nested wrappers, a stylesheet and a low-contrast note per section (about 850 issues).
const section = (i: number) =>
    `<div class="card"><h2>Section ${i}</h2><p>Some text <a href="/page/${i}">page ${i}</a></p><button>Action ${i}</button><p class="note">Note ${i}</p></div>`;
const STYLE = '<style>.card { background: #f4f4f4; padding: 8px } .note { color: #aaa } .wrap { background: rgba(0,0,0,.02) }</style>';
const wrap = (html: string, depth: number): string => (depth === 0 ? html : `<div class="wrap">${wrap(html, depth - 1)}</div>`);
const PAGE = `<!doctype html><html lang="en"><head><title>Performance</title>${STYLE}</head><body><main><h1>Performance</h1>${
    wrap(Array.from({ length: SECTIONS }, (_, i) => section(i)).join(''), 10)
}</main></body></html>`;

test('one run on 5,000 elements', async ({ page }) => {
    await openPage(page, PAGE);
    const timings = await page.evaluate(async () => {
        const { seoAccessibilityTool } = await import('/index.js');
        await seoAccessibilityTool(); // warm-up
        const times: number[] = [];
        for (let i = 0; i < 5; i++) {
            const start = performance.now();
            await seoAccessibilityTool();
            times.push(performance.now() - start);
        }
        return { elements: document.querySelectorAll('*').length, median: times.sort((a, b) => a - b)[2] };
    });
    console.log(`SAT run: ${timings.median.toFixed(0)} ms on ${timings.elements} elements`);
    expect(timings.elements).toBeGreaterThan(5000);
});
