import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { rules } from '../../src/core/rules';
import type { RuleId } from '../../src/core/seoAccessibilityTool';
import { openPage } from './serve';

/**
 * The W3C ACT rules' own test cases (tests/act/<rule>.json, from
 * https://www.w3.org/WAI/content-assets/wcag-act-rules/testcases.json): a "failed" case must
 * produce an issue of the SAT rule, "passed" and "inapplicable" cases none.
 */

const SAT_RULE: Record<string, RuleId> = {
    '5f99a7': 'aria-attributes', '6a7281': 'aria-attributes', '4e8ab6': 'aria-attributes', '5c01ea': 'aria-attributes', kb1m8s: 'aria-attributes',
    '6cfa84': 'aria-hidden-focus',
    b4f0c3: 'meta-viewport',
    bc659a: 'meta-refresh',
    cae760: 'iframe-name',
    '2t702h': 'accessible-name', m6b1q3: 'accessible-name', ffd0e9: 'accessible-name', '8fc3b6': 'accessible-name',
    '73f2c2': 'autocomplete-valid',
    '2ee8b8': 'label-in-name',
    a25f45: 'table-headers', d0f69e: 'table-headers',
    '80f0bf': 'media-autoplay',
    b5c3f8: 'html-lang', bf051a: 'html-lang', de46e4: 'html-lang',
};

/** Cases SAT can't decide without running the page or knowing the media, with the reason. */
const KNOWN: Record<string, string> = {
    '6cfa84 Passed Example 4': 'the focus sentinel moves focus away with a script',
    'kb1m8s Passed Example 3': 'role="heading" without aria-level fails ACT 4e8ab6, checked by the same SAT rule',
    'bf051a Failed Example 3': 'three-letter codes are accepted ("eng" is registered as "en"): see isValidLanguageTag',
    'de46e4 Failed Example 8': 'three-letter codes are accepted ("eng" is registered as "en"): see isValidLanguageTag',
    '80f0bf Passed Example 3': 'the page has its own pause button',
    '80f0bf Inapplicable Example 2': 'the video has no audio track',
};

interface ActCase {
    id: string;
    title: string;
    expected: 'passed' | 'failed' | 'inapplicable';
    html: string;
}

const files = readdirSync('tests/act').filter((file) => file.endsWith('.json'));

for (const file of files) {
    const { rule: act, name, cases } = JSON.parse(readFileSync(`tests/act/${file}`, 'utf8')) as { rule: string; name: string; cases: ActCase[] };
    const ruleId = SAT_RULE[act];

    test(`ACT ${act} ${name} (${ruleId})`, async ({ page }) => {
        const only = { rules: Object.fromEntries(rules.map((r) => [r.id, r.id === ruleId ? r.defaultSeverity : 'off'])) };
        const mismatches: string[] = [];

        for (const c of cases) {
            const known = KNOWN[`${act} ${c.title}`];
            await page.unrouteAll({ behavior: 'ignoreErrors' });
            // Other origins answer 204, so a meta refresh to them doesn't leave the page.
            await page.route(/^(?!http:\/\/sat\.test\/)/, (route) => route.fulfill({ status: 204 }));
            await openPage(page, c.html);
            const messages = await page.evaluate(async (options) => {
                const { seoAccessibilityTool } = await import('/index.js');
                return (await seoAccessibilityTool(options)).issues.map((issue) => issue.message);
            }, only);

            const reported = messages.length > 0;
            if (reported !== (c.expected === 'failed') && !known) {
                mismatches.push(`${c.title} (${c.expected}): ${reported ? messages.join(' | ') : 'nothing reported'}`);
            }
        }
        expect(mismatches).toEqual([]);
    });
}
