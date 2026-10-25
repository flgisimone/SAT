import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { openPage } from './serve';

// demo/index.html, the page published on GitHub Pages next to dist/sat-controller.js and dist/chunks/,
// as openPage serves it here. Its bar must add no issues to those of examples/page/expected.json.

const DEMO = readFileSync(new URL('../../demo/index.html', import.meta.url), 'utf8');
const EXPECTED = JSON.parse(readFileSync(new URL('../../examples/page/expected.json', import.meta.url), 'utf8'));

interface Found { ruleId: string; severity: string; selector: string | null }

const sorted = (issues: Found[]) => issues.map((issue) => JSON.stringify(issue)).sort();

test('the demo opens with SAT on and its panel open, and reports the issues of expected.json only', async ({ page }) => {
    await openPage(page, DEMO);
    await expect(page.locator('.results')).toHaveText('5 errors · 3 warnings');
    await expect(page.getByRole('region', { name: 'SAT results' })).toBeVisible();

    const found = await page.evaluate(async (options) => {
        const { runSAT } = await import('/index.js');
        const { issues } = await runSAT(options);
        return issues.map(({ ruleId, severity, selector }) => ({ ruleId, severity, selector: selector ?? null }));
    }, EXPECTED.options);
    expect(sorted(found)).toEqual(sorted(EXPECTED.issues));
});

test('a reload keeps SAT on and the panel open', async ({ page }) => {
    await openPage(page, DEMO);
    await expect(page.locator('.results')).toHaveText('5 errors · 3 warnings');
    await page.reload();
    await expect(page.locator('.results')).toHaveText('5 errors · 3 warnings');
    await expect(page.getByRole('region', { name: 'SAT results' })).toBeVisible();
});

test('on a phone SAT is on with the panel closed, so it does not cover the page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, DEMO);
    await expect(page.locator('.results')).toHaveText('5 errors · 3 warnings');
    await expect(page.getByRole('region', { name: 'SAT results' })).toBeHidden();
});
