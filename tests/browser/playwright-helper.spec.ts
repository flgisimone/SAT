import { expect as baseExpect, test } from '@playwright/test';
import { checkPage, expect } from '../../dist/playwright.js';
import { openPage } from './serve';

// seo-accessibility-tool/playwright on pages that don't import SAT.

const CLEAN = `<!doctype html><html lang="en"><head><title>Clean page</title>
<meta name="description" content="A page without SAT errors."></head>
<body><main><h1>Clean page</h1><p>Some text.</p></main></body></html>`;

const DIRTY = `<!doctype html><html lang="en"><head><title>Dirty page</title></head>
<body><main><h1>Dirty page</h1><img id="photo" src="data:,"></main></body></html>`;

test('checkPage returns the issues with their selectors', async ({ page }) => {
    await openPage(page, DIRTY);
    const report = await checkPage(page);

    baseExpect(report.issues).toContainEqual(baseExpect.objectContaining({ ruleId: 'image-alt', severity: 'error', selector: '[id="photo"]' }));
    baseExpect(report.summary.errors).toBe(report.issues.filter((issue) => issue.severity === 'error').length);
});

test('toHaveNoSATErrors passes on a clean page', async ({ page }) => {
    await openPage(page, CLEAN);
    await expect(page).toHaveNoSATErrors();
});

test('toHaveNoSATErrors fails with the list of errors', async ({ page }) => {
    await openPage(page, DIRTY);
    const failure = await expect(page).toHaveNoSATErrors().then(() => null, (error: Error) => error.message);

    baseExpect(failure).toMatch(/Expected no SAT errors, found \d+ errors?:/);
    baseExpect(failure).toMatch(/error\s+image-alt\s+.*alt.*\n\s+\[id="photo"\]/);
});

test('options reach the page, and axe runs on request', async ({ page }) => {
    await openPage(page, DIRTY);
    await expect(page).toHaveNoSATErrors({ rules: { 'image-alt': 'warning', 'seo-meta': 'off' } });

    const { issues } = await checkPage(page, { axe: true });
    const rules = issues.map((issue) => issue.ruleId);
    baseExpect(rules).toContain('axe/image-alt');
    baseExpect(rules).not.toContain('image-alt');
});
