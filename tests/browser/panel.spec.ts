import { expect, test, type Page } from '@playwright/test';
import { rules } from '../../src/core/rules';
import type { RuleId, SATOptions } from '../../src/core/seoAccessibilityTool';
import { STYLES } from '../../src/ui/styles';
import { openPage } from './serve';

// The in-page panel (sat-controller) in Chromium. Locators pierce SAT's open shadow root.

/** Options that turn on only the given rules. */
function only(ids: RuleId[]): Partial<SATOptions> {
    return { rules: Object.fromEntries(rules.map((rule) => [rule.id, ids.includes(rule.id) ? 'error' : 'off'])) };
}

function html(body: string, options: Partial<SATOptions>, head = ''): string {
    return `<!doctype html><html lang="en"><head><title>Test page</title>${head}</head><body>${body}
<script type="module">import { satChecker } from '/sat-controller.js'; satChecker(${JSON.stringify({ enabled: true, ...options })});</script>
</body></html>`;
}

const results = (page: Page) => page.locator('.results');

async function start(page: Page, body: string, options: Partial<SATOptions> = {}, head = ''): Promise<void> {
    await openPage(page, html(body, options, head));
    await page.locator('#sat-run-button').click();
    await expect(results(page)).not.toHaveText('Running…');
}

/** Position of the first box and of the element, rounded. */
function geometry(page: Page, selector: string) {
    return page.evaluate((selector) => {
        const round = (r: DOMRect) => [r.top, r.left, r.width, r.height].map(Math.round);
        const box = document.querySelector('sat-panel')!.shadowRoot!.querySelector<HTMLElement>('.box.error');
        return { box: box && !box.hidden ? round(box.getBoundingClientRect()) : null, element: round(document.querySelector(selector)!.getBoundingClientRect()) };
    }, selector);
}

const UNNAMED = '<button id="b" style="width: 80px; height: 30px"></button>';

test('the page CSS does not change the panel, and the panel CSS does not leak into the page', async ({ page }) => {
    const css = '<style>button { background: red !important } * { color: red !important; font-family: serif !important }</style>';
    await start(page, `${UNNAMED}<div class="panel" id="own">x</div>`, only(['accessible-name']), css);

    const run = page.locator('#sat-run-button');
    await expect(run).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(results(page)).toHaveCSS('color', 'rgb(26, 26, 26)');
    await expect(page.locator('#b')).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    await expect(page.locator('#own')).toHaveCSS('position', 'static');
});

test('boxes follow the element, survive re-renders, and leave the page untouched', async ({ page }) => {
    await openPage(page, html(`<main>${UNNAMED}</main>`, only(['accessible-name'])));
    await expect(page.locator('#sat-run-button')).toBeVisible();
    const before = await page.evaluate(() => document.documentElement.outerHTML);

    await page.locator('#sat-run-button').click();
    await expect.poll(() => geometry(page, '#b').then((g) => g.box)).toEqual((await geometry(page, '#b')).element);
    expect(await page.evaluate(() => document.documentElement.outerHTML)).toBe(before);

    // A re-render that rewrites the style attribute, then one that replaces the node.
    await page.evaluate(() => document.getElementById('b')!.setAttribute('style', 'width: 120px; height: 40px; margin-top: 50px'));
    await expect.poll(async () => { const g = await geometry(page, '#b'); return g.box?.join() === g.element.join(); }).toBe(true);
    await page.evaluate(() => { const b = document.getElementById('b')!; b.replaceWith(b.cloneNode()); });
    await expect.poll(async () => { const g = await geometry(page, '#b'); return g.box?.join() === g.element.join(); }).toBe(true);

    await page.evaluate(() => document.getElementById('b')!.setAttribute('style', 'width: 80px; height: 30px'));
    await page.locator('#sat-run-button').click(); // stop
    await expect(page.locator('#sat-run-button')).toHaveAttribute('aria-label', 'Run SAT checks');
    expect(await page.evaluate(() => document.documentElement.outerHTML)).toBe(before);
});

test('clicking an issue scrolls to the element and focuses it', async ({ page }) => {
    await start(page, `<div style="height: 3000px"></div>${UNNAMED}`, only(['accessible-name']));
    await expect(page.locator('#b')).not.toBeInViewport();

    await results(page).click();
    await page.locator('summary', { hasText: 'accessible-name (1)' }).click();
    await page.locator('.item', { hasText: 'Missing accessible name' }).click();

    await expect(page.locator('#b')).toBeInViewport();
    await expect(page.locator('#b')).toBeFocused();
    await expect(page.locator('.box.pulse')).toBeVisible();
});

test('200 issues: groups closed, correct counts, filters hide issues and boxes', async ({ page }) => {
    const buttons = '<button style="width: 20px; height: 20px"></button>'.repeat(120);
    const images = '<img src="data:," width="20" height="20">'.repeat(80);
    await start(page, buttons + images, only(['accessible-name', 'image-alt']));

    await expect(results(page)).toHaveText('200 errors · 0 warnings');
    await results(page).click();
    await expect(page.locator('summary')).toHaveText(['accessible-name (120)', 'image-alt (80)']);
    expect(await page.locator('details').evaluateAll((all) => all.filter((d) => (d as HTMLDetailsElement).open).length)).toBe(0);
    await expect(page.locator('.box:not(.pulse)')).toHaveCount(200);

    await page.getByLabel('Errors (200)').uncheck();
    await expect(page.getByText('No issues match the filters.')).toBeVisible();
    await expect(page.locator('.box:not(.pulse)')).toHaveCount(0);
});

test('Structure: the heading tree follows the order and levels of the page', async ({ page }) => {
    await start(page, '<h1>Title</h1><h2>A</h2><h4>B</h4><h2>C</h2><h3>D</h3><div style="height: 3000px"></div><h2 id="last">E</h2>', only(['h1']));
    await results(page).click();
    await page.getByRole('button', { name: 'Structure (6)' }).click();

    const depth = await page.locator('.outline .item').evaluateAll((items) =>
        items.map((item) => { let n = 0; for (let ul = item.closest('ul'); ul; ul = ul.parentElement!.closest('ul')) n++; return n; }));
    await expect(page.locator('.outline .item')).toHaveText(['H1Title', 'H2A', 'H4B — level skipped', 'H2C', 'H3D', 'H2E']);
    expect(depth).toEqual([1, 2, 3, 2, 3, 2]);

    await page.locator('.outline .item', { hasText: 'H2E' }).click();
    await expect(page.locator('#last')).toBeInViewport();
});

test('SPA: a route change reruns the checks; observeDom reruns them on DOM changes', async ({ page }) => {
    const app = `<main><a href="/about" id="go">About</a><div id="view"></div></main>
<script>document.getElementById('go').addEventListener('click', (event) => {
    event.preventDefault();
    history.pushState({}, '', '/about');
    document.getElementById('view').innerHTML = '<img src="data:,">';
});</script>`;
    await start(page, app, { ...only(['image-alt']), observeDom: 50 });
    await expect(results(page)).toHaveText('0 errors · 0 warnings');

    await page.locator('#go').click();
    await expect(results(page)).toHaveText('1 error · 0 warnings');

    await page.evaluate(() => document.getElementById('view')!.append(document.createElement('img')));
    await expect(results(page)).toHaveText('2 errors · 0 warnings');
});

test('SAT stays on after a reload until it is stopped', async ({ page }) => {
    await start(page, UNNAMED, only(['accessible-name']));
    await page.reload();
    await expect(results(page)).toHaveText('1 error · 0 warnings');

    await page.locator('#sat-run-button').click();
    await page.reload();
    await expect(page.locator('#sat-run-button')).toHaveAttribute('aria-label', 'Run SAT checks');
    await expect(results(page)).toBeHidden();
});

test('keyboard: Escape closes the panel and returns focus to the results button', async ({ page }) => {
    await start(page, UNNAMED, only(['accessible-name']));
    await results(page).click();
    await expect(results(page)).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Issues (1)' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#sat-results')).toBeHidden();
    await expect(results(page)).toBeFocused();
});

test('SAT reports no issues on its own panel', async ({ page, context }) => {
    await start(page, `<main><h1>A</h1><h3>B</h3>${UNNAMED}<img src="data:,"></main>`);
    await results(page).click();
    await page.getByRole('button', { name: /^Structure/ }).click();
    const panel = await page.locator('sat-panel').evaluate((host) => {
        const copy = document.createElement('div');
        copy.innerHTML = host.shadowRoot!.innerHTML;
        copy.querySelectorAll('[hidden]').forEach((el) => el.removeAttribute('hidden'));
        copy.querySelectorAll('details').forEach((el) => el.setAttribute('open', ''));
        return copy.innerHTML;
    });

    expect(panel).toContain('class="item"');

    // The panel's markup as a page of its own, checked by every rule.
    const other = await context.newPage();
    await openPage(other, `<!doctype html><html lang="en"><head><title>SAT panel</title>
<meta name="description" content="The SAT panel checked by SAT itself, with every rule turned on.">
<meta name="viewport" content="width=device-width"><link rel="canonical" href="https://example.com/">
<meta property="og:title" content="SAT panel"><meta property="og:type" content="website">
<meta property="og:image" content="https://example.com/a.png"><meta property="og:url" content="https://example.com/">
<meta name="twitter:card" content="summary"><style>${STYLES}</style></head><body><main><h1>SAT panel</h1>${panel}</main></body></html>`);
    const issues = await other.evaluate(async () => {
        const { seoAccessibilityTool } = await import('/index.js');
        return (await seoAccessibilityTool({ rules: { 'link-text': 'warning' } })).issues.map((issue) => issue.message);
    });
    expect(issues).toEqual([]);
});
