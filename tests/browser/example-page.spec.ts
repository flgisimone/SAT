import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { openPage } from './serve';

// examples/page: the page with known issues that the examples, the demo and the videos use.
// runSAT reports exactly the issues of expected.json, so its valid patterns stay unreported.

const PAGE = readFileSync(new URL('../../examples/page/index.html', import.meta.url), 'utf8');
const EXPECTED = JSON.parse(readFileSync(new URL('../../examples/page/expected.json', import.meta.url), 'utf8'));

interface Found { ruleId: string; severity: string; selector: string | null }

const sorted = (issues: Found[]) => issues.map((issue) => JSON.stringify(issue)).sort();

test('runSAT on the example page reports the issues of expected.json, and no others', async ({ page }) => {
    await openPage(page, PAGE);
    const found = await page.evaluate(async (options) => {
        const { runSAT } = await import('/index.js');
        const { issues } = await runSAT(options);
        return issues.map(({ ruleId, severity, selector }) => ({ ruleId, severity, selector: selector ?? null }));
    }, EXPECTED.options);

    expect(sorted(found)).toEqual(sorted(EXPECTED.issues));
});
