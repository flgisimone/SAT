import { beforeEach, describe, expect, it } from 'vitest';
import { seoAccessibilityTool } from '../src/core/seoAccessibilityTool';
import { axe } from '../src/engines/axe';

beforeEach(() => {
    document.documentElement.setAttribute('lang', 'en');
    document.body.innerHTML = '<main><h1>Title</h1><img src="a.png"></main>';
});

describe('axe-core engine', () => {
    it('turns axe violations into issues and turns off the SAT rules it replaces', async () => {
        const { issues } = await seoAccessibilityTool({ engines: [axe()] });
        const img = document.querySelector('img');

        expect(issues.some((issue) => issue.ruleId === 'image-alt')).toBe(false);
        expect(issues.find((issue) => issue.ruleId === 'axe/image-alt')).toMatchObject({
            severity: 'error',
            category: 'a11y',
            wcag: ['1.1.1'],
            element: img,
            selector: 'html > body > main > img',
            help: expect.stringContaining('dequeuniversity.com/rules/axe/'),
        });
        // SAT rules axe doesn't cover keep running.
        expect(issues.some((issue) => issue.ruleId === 'seo-meta')).toBe(true);
    });

    it('rules sets axe rules by their prefixed id and turns a replaced SAT rule back on', async () => {
        const { issues } = await seoAccessibilityTool({ engines: [axe()], rules: { 'axe/image-alt': 'off', 'image-alt': 'warning' } });
        expect(issues.filter((issue) => issue.ruleId.endsWith('image-alt')).map((issue) => [issue.ruleId, issue.severity])).toEqual([['image-alt', 'warning']]);
    });

    it('skips SAT\'s own UI and runs started together do not fail', async () => {
        document.body.insertAdjacentHTML('beforeend', '<div data-sat-ignore><img src="sat.png"></div>');
        const engine = axe();
        const results = await Promise.all([seoAccessibilityTool({ engines: [engine] }), seoAccessibilityTool({ engines: [engine] })]);
        for (const { issues } of results) {
            expect(issues.filter((issue) => issue.message.includes('internal error'))).toEqual([]);
            expect(issues.filter((issue) => issue.ruleId === 'axe/image-alt')).toHaveLength(1);
        }
    });
});
