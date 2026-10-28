import { expect, test } from '@playwright/test';
import { openPage } from './serve';

// The entry points share one chunk: SAT is loaded once even when an app imports more than one of them.

const PAGE = `<!doctype html><html lang="en"><head></head><body><main><h1 id="a">A</h1><h1 id="b">B</h1></main></body></html>`;

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

test('index and sat-controller load the shared chunk once', async ({ page }) => {
    await openPage(page, PAGE);
    const chunks: string[] = [];
    page.on('request', (request) => { if (request.url().includes('/chunks/')) chunks.push(request.url()); });

    await page.evaluate(async () => {
        const { seoAccessibilityTool } = await import('/index.js');
        await seoAccessibilityTool();
        const { satChecker } = await import('/sat-controller.js');
        satChecker({ enabled: true });
    });
    await expect(page.locator('#sat-run-button')).toBeVisible();
    expect(chunks).toHaveLength(1);
});
