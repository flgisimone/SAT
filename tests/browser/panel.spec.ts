import { readFileSync } from 'node:fs';
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
    await page.mouse.move(600, 10); // not hovering the button
    await expect(run).toHaveCSS('background-color', 'rgb(255, 255, 255)'); // the stop button, SAT is running
    await expect(results(page)).toHaveCSS('color', 'rgb(31, 35, 40)');
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
    await expect(page.locator('.rule-title')).toHaveText(['Elements have an accessible name']);
    await expect(page.locator('.item', { hasText: 'Missing accessible name' })).toBeVisible(); // no group to open
    await page.locator('.item', { hasText: 'Missing accessible name' }).click();

    await expect(page.locator('#b')).toBeInViewport();
    await expect(page.locator('#b')).toBeFocused();
    await expect(page.locator('.box.pulse')).toBeVisible();
});

test('200 issues: five per rule until "Show more", counters filter the issues and the boxes', async ({ page }) => {
    const buttons = '<button style="width: 20px; height: 20px"></button>'.repeat(120);
    const images = '<img src="data:," width="20" height="20">'.repeat(80);
    await start(page, buttons + images, only(['accessible-name', 'image-alt']));

    await expect(results(page)).toHaveText('200 errors · 0 warnings');
    await results(page).click();
    await expect(page.locator('.rule-title')).toHaveText(['Elements have an accessible name', 'Images have alternative text']);
    await expect(page.locator('.rule .pill')).toHaveText(['120', '80']);
    await expect(page.locator('.rule .chip')).toHaveText(['WCAG 4.1.2', 'WCAG 1.1.1']);
    await expect(page.locator('.item')).toHaveCount(10);
    await expect(page.locator('.box:not(.pulse)')).toHaveCount(200);

    await page.getByRole('button', { name: 'Show 75 more' }).click();
    await expect(page.locator('.item')).toHaveCount(85);

    const errors = page.getByRole('button', { name: '200 Errors', exact: true });
    await expect(errors).toHaveAttribute('aria-pressed', 'true');
    await errors.click();
    await expect(errors).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByText('No issues match the filters.')).toBeVisible();
    await expect(page.locator('.box:not(.pulse)')).toHaveCount(0);

    await errors.click();
    await page.getByRole('button', { name: '200 Accessibility', exact: true }).click();
    await expect(page.locator('.box:not(.pulse)')).toHaveCount(0); // both rules are accessibility rules
    await page.getByRole('button', { name: '200 Accessibility', exact: true }).click();
    await expect(page.locator('.box:not(.pulse)')).toHaveCount(200);
});

test('Structure: the heading tree follows the order and levels of the page', async ({ page }) => {
    await start(page, '<h1>Title</h1><h2>A</h2><h4>B</h4><h2>C</h2><h3>D</h3><div style="height: 3000px"></div><h2 id="last">E</h2>', only(['h1']));
    await results(page).click();
    await page.getByRole('button', { name: 'Structure 6' }).click();

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

test('keyboard: every control is reached with Tab and works with Enter; Escape closes and returns focus', async ({ page }) => {
    await start(page, `<main><h1>A</h1>${UNNAMED}</main>`, only(['accessible-name']));
    await results(page).focus();
    await page.keyboard.press('Enter');
    await expect(results(page)).toHaveAttribute('aria-expanded', 'true');

    const names: string[] = [];
    for (let i = 0; i < 11; i++) {
        await page.keyboard.press('Tab');
        names.push(await page.evaluate(() => {
            const active = document.querySelector('sat-panel')!.shadowRoot!.activeElement;
            return active?.getAttribute('aria-label') ?? active?.textContent?.trim() ?? '';
        }));
    }
    expect(names).toEqual([
        'Move SAT to the right', 'Close SAT results', '1 Errors', '0 Warnings', '1 Accessibility', '0 SEO',
        'Issues 1', 'Structure 1', 'Why and how to fix: Elements have an accessible name (opens in a new tab)',
        'Copy prompt for all: Elements have an accessible name',
        'Missing accessible name on <button id="b">. Add visible text, aria-label or aria-labelledby.',
    ]);

    await page.keyboard.press('Enter');
    await expect(page.locator('#b')).toBeFocused();

    await results(page).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: '1 Errors' })).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Escape');
    await expect(page.locator('#sat-results')).toBeHidden();
    await expect(results(page)).toBeFocused();
});

test('pointing at a box shows the severity and title of its issues, inside the viewport, without changing the page', async ({ page }) => {
    await openPage(page, html('<main><h1>A</h1><button id="b" style="position: absolute; top: 0; right: 0; width: 60px; height: 30px"></button></main>', only(['accessible-name'])));
    await expect(page.locator('#sat-run-button')).toBeVisible();
    const before = await page.evaluate(() => document.documentElement.outerHTML);
    await page.locator('#sat-run-button').click();
    await expect(results(page)).toHaveText('1 error · 0 warnings');

    const tag = page.locator('.tag');
    await expect(tag).toBeHidden();
    const box = (await page.locator('#b').boundingBox())!;
    await page.mouse.move(box.x + 30, box.y + 15);
    await expect(tag).toHaveText('Error · Elements have an accessible name');
    await expect(tag).toBeInViewport({ ratio: 1 });

    await page.mouse.move(10, 300);
    await expect(tag).toBeHidden();
    await page.mouse.click(box.x + 30, box.y + 15); // a click (or a tap) shows it too, and reaches the page
    await expect(tag).toBeVisible();
    await expect(page.locator('#b')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.outerHTML)).toBe(before);
});

test('the panel moves to the right and stays there after a reload', async ({ page }) => {
    await start(page, UNNAMED, only(['accessible-name']));
    await results(page).click();
    await page.getByRole('button', { name: 'Move SAT to the right' }).click();
    const right = await page.locator('#sat-results').evaluate((panel) => innerWidth - panel.getBoundingClientRect().right);
    expect(right).toBe(16);

    await page.reload();
    await expect(page.locator('.dock')).toHaveClass(/right/);
    await results(page).click();
    await page.getByRole('button', { name: 'Move SAT to the left' }).click();
    await expect(page.locator('.dock')).not.toHaveClass(/right/);
});

test('with reduced motion the panel and the reveal box do not animate', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await start(page, UNNAMED, only(['accessible-name']));
    await results(page).click();
    await expect(page.locator('#sat-results')).toHaveCSS('animation-name', 'none');
    await page.locator('.item').click();
    await expect(page.locator('.box.pulse')).toBeVisible();
    expect(await page.locator('sat-panel').evaluate((host) => host.shadowRoot!.getAnimations().length)).toBe(0);
});

/** What `fixPrompt` returns in the page for the issues of a rule. */
function expectedPrompt(page: Page, ruleId: string): Promise<string> {
    return page.evaluate(async (ruleId) => {
        const { fixPrompt, seoAccessibilityTool } = await import('/index.js');
        const { issues } = await seoAccessibilityTool();
        return fixPrompt(issues.filter((issue: { ruleId: string }) => issue.ruleId === ruleId), { url: location.href });
    }, ruleId);
}

test('"Copy fix prompt" copies the prompt of an issue, "Copy prompt for all" the one of the rule', async ({ page }) => {
    await start(page, `${UNNAMED}<button id="c"></button>`, only(['accessible-name']));
    // The test page (http://sat.test) is not a secure context, so it has no clipboard: a stub keeps what SAT writes.
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: async (text: string) => void ((window as unknown as { copied: string }).copied = text) },
    }));
    await results(page).click();
    const clipboard = () => page.evaluate(() => (window as unknown as { copied: string }).copied);

    await page.locator('.row').first().getByRole('button', { name: 'Copy fix prompt' }).click();
    await expect(page.getByRole('status')).toHaveText('Copied');
    const one = await clipboard();
    expect(one).toMatch(/^Fix this issue/);
    expect(one).toContain('Selector: [id="b"]');

    await page.getByRole('button', { name: 'Copy prompt for all: Elements have an accessible name' }).click();
    expect(await clipboard()).toBe(await expectedPrompt(page, 'accessible-name'));
});

test('without the clipboard the prompt appears selected in a text box', async ({ page }) => {
    await start(page, UNNAMED, only(['accessible-name']));
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } }));
    await results(page).click();
    await page.getByRole('button', { name: 'Copy fix prompt' }).click();

    const box = page.getByLabel('Clipboard unavailable: copy the fix prompt from here');
    await expect(box).toBeFocused();
    expect(await box.inputValue()).toBe(await expectedPrompt(page, 'accessible-name'));
    expect(await box.evaluate((textarea: HTMLTextAreaElement) => textarea.selectionEnd - textarea.selectionStart)).toBe(await box.evaluate((textarea: HTMLTextAreaElement) => textarea.value.length));
    await page.getByRole('button', { name: 'Close fix prompt' }).click();
    await expect(box).toBeHidden();
});

test('Fix with AI: a stream that ends without a result says the connection was lost', async ({ page }) => {
    const stream = JSON.stringify({ type: 'message', text: 'Reading src/App.vue' });
    await openPage(page, html(UNNAMED, { ...only(['accessible-name']), aiFix: { url: '/__sat/fix', token: 't' } }), { '/__sat/fix': stream });
    await page.locator('#sat-run-button').click();
    await results(page).click();
    await page.getByRole('button', { name: 'Fix with Claude Code', exact: true }).click();

    await expect(page.locator('.fix-status')).toHaveText('Fix failed · Elements have an accessible name');
    await expect(page.locator('.fix-summary')).toHaveText('The connection to the dev server was lost.');
    await expect(page.getByRole('status')).toHaveText('Fix failed Elements have an accessible name');
});

const AXE = readFileSync(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

for (const colorScheme of ['light', 'dark'] as const) {
    test(`SAT and axe-core report no issues on their own panel (${colorScheme} theme)`, async ({ page, context }) => {
        await page.emulateMedia({ colorScheme });
        // With "Fix with AI" on and the result of a fix shown (a stub endpoint that streams a finished fix).
        const fix = [
            { type: 'warning', message: 'The repository has uncommitted changes.' },
            { type: 'file', path: 'src/App.vue' },
            { type: 'end', ok: true, summary: 'Added the alt text.', files: ['src/App.vue'] },
        ].map((event) => JSON.stringify(event)).join('\n');
        // With "Send to agent" (a stub queue endpoint, the states pushed by the test) and the hint about mcp.
        const agent = 'satChecker({ mcp: { url: "/__sat/results", queue: "/__sat/queue", token: "t", status: (show) => (window.satStatus = show) }, suggestMcp: true, ';
        const page$ = html(`<main><h1>A</h1><h3>B</h3>${UNNAMED}<img src="data:,"><p style="color: #bbb">Low</p></main>`, { aiFix: { url: '/__sat/fix', token: 't' } }).replace('satChecker({', agent);
        await openPage(page, page$, { '/__sat/fix': fix, '/__sat/queue': '', '/__sat/results': '' });
        await page.locator('#sat-run-button').click();
        await results(page).click();
        await page.locator('.rule', { hasText: 'Images have alternative text' }).getByRole('button', { name: 'Fix with Claude Code', exact: true }).click();
        await expect(page.locator('.fix-status')).toHaveText('Still present · Images have alternative text');

        const queued = page.waitForRequest((request) => request.url().endsWith('/__sat/queue'));
        await page.locator('.rule', { hasText: 'Images have alternative text' }).getByRole('button', { name: 'Send to agent', exact: true }).click();
        const [added] = ((await queued).postDataJSON() as { add: Array<{ id: string; message: string; title: string; prompt: string }> }).add;
        expect(added.prompt).toContain('## Images have alternative text (image-alt)');
        await page.evaluate((issue) => {
            const show = (window as unknown as { satStatus: (status: unknown) => void }).satStatus;
            show({ page: '/', issues: [{ ...issue, state: 'taken' }, { ...issue, id: 'other', state: 'verified' }] });
        }, added);
        await expect(page.locator('.row .agent-status')).toHaveText('Taken by the agent');
        const panel = await page.locator('sat-panel').evaluate((host) => {
            const copy = document.createElement('div');
            copy.innerHTML = host.shadowRoot!.innerHTML;
            copy.querySelectorAll('.layer').forEach((el) => el.remove());
            const structure = copy.querySelectorAll<HTMLElement>('.view')[1];
            structure.removeAttribute('hidden');
            copy.querySelector('.panel')!.append(structure); // both views, the second after the first
            copy.querySelectorAll('[hidden]').forEach((el) => el.removeAttribute('hidden'));
            return copy.innerHTML;
        });
        expect(panel).toContain('class="item"');

        // The panel's markup as a page of its own, checked by every SAT rule and by axe-core.
        const other = await context.newPage();
        await other.emulateMedia({ colorScheme });
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

        await other.addScriptTag({ content: AXE });
        const violations = await other.evaluate(async () => {
            const { violations } = await (window as unknown as { axe: typeof import('axe-core') }).axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] });
            return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
        });
        expect(violations).toEqual([]);
    });
}
