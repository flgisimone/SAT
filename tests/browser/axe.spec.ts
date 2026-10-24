import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { openPage } from './serve';

// seo-accessibility-tool/axe with the real axe-core, imported by the bare name as an app would.

const AXE_MODULE = `${readFileSync(new URL('../../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8')}\nexport default window.axe;`;

const PAGE = `<!doctype html><html lang="en"><head><title>Axe</title>
<script type="importmap">{ "imports": { "axe-core": "/axe-core.js" } }</script>
</head><body><main><h1>Axe</h1><img id="no-alt" src="data:,"></main>
<script type="module">
import { satChecker } from '/sat-controller.js';
import { axe } from '/axe.js';
satChecker({ enabled: true, engines: [axe()] });
</script></body></html>`;

test('the panel lists axe issues with their help page, and the replaced SAT rule is off', async ({ page }) => {
    await openPage(page, PAGE, { '/axe-core.js': AXE_MODULE });
    await page.locator('#sat-run-button').click();
    await expect(page.locator('.results')).not.toHaveText('Running…');
    await page.locator('.results').click();

    const group = page.locator('.rule', { has: page.locator('.rule-title', { hasText: /^Images must have alternative text$/ }) });
    await expect(group).toHaveCount(1);
    await expect(group.locator('a.docs')).toHaveAttribute('href', /dequeuniversity\.com\/rules\/axe\/[\d.]+\/image-alt/);
    await expect(page.locator('.rule-title', { hasText: 'Images have alternative text' })).toHaveCount(0);
});
