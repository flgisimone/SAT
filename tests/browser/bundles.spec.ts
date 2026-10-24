import { expect, test } from '@playwright/test';
import { openPage } from './serve';

// The entry points share one chunk: SAT's state (saved highlights) exists once
// even when an app imports more than one of them.

const REACT_STUB = 'export function useEffect(effect) { effect(); }';
const PAGE = `<!doctype html><html lang="en"><head>
<script type="importmap">{ "imports": { "react": "/react-stub.js" } }</script>
</head><body><main><h1 id="a">A</h1><h1 id="b">B</h1></main></body></html>`;

test('without a bundler, enabled: true shows the button; without it SAT stays off', async ({ page }) => {
    await openPage(page, PAGE);
    await page.evaluate(async () => {
        const { satChecker } = await import('/sat-controller.js');
        satChecker();
    });
    await expect(page.locator('#sat-run-button')).toHaveCount(0);

    await page.evaluate(async () => {
        const { satChecker } = await import('/sat-controller.js');
        satChecker({ enabled: true });
    });
    await expect(page.locator('#sat-run-button')).toBeVisible();
});

test('index and react share state: stopping SAT also clears highlights from an index run', async ({ page }) => {
    await openPage(page, PAGE, { '/react-stub.js': REACT_STUB });
    const outline = () => page.locator('#a').evaluate((el) => (el as HTMLElement).style.outline);

    await page.evaluate(async () => {
        const { seoAccessibilityTool } = await import('/index.js');
        await seoAccessibilityTool();
    });
    expect(await outline()).not.toBe('');

    await page.evaluate(async () => {
        const { useSATChecker } = await import('/react.js');
        useSATChecker({ enabled: true });
    });
    const button = page.locator('#sat-run-button');
    await button.click(); // run
    await expect(button).toHaveAttribute('aria-label', 'Stop SAT and clear highlights');
    await button.click(); // stop

    expect(await outline()).toBe('');
});
