import { describe, expect, it } from 'vitest';
import type { Issue } from '../src/sat/issue';
import { issueIds } from '../src/sat/issue';
import { pageResults } from '../src/sat/mcpResults';
import { changes } from '../src/integrations/mcpServer';

describe('results a page sends to the MCP server', () => {
    it('the prompt of fixPrompt plus the issues without their element, with the component when known', () => {
        document.title = 'Shop';
        document.body.innerHTML = '<img id="photo" src="a.png">';
        const img = document.getElementById('photo')!;
        (img as Element & { __vueParentComponent?: unknown }).__vueParentComponent = { type: { __file: '/src/Photo.vue' } };
        const issue: Issue = { ruleId: 'image-alt', severity: 'error', category: 'a11y', message: 'Image without alt', element: img, selector: '[id="photo"]', help: 'https://example.test' };

        const results = pageResults([issue]);
        expect(results.url).toBe(location.href.split('#')[0]);
        expect(results.title).toBe('Shop');
        expect(results.prompt).toContain('<img id="photo" src="a.png">');
        expect(results.issues).toEqual([{ id: 'image-alt [id="photo"]', ruleId: 'image-alt', severity: 'error', title: undefined, message: 'Image without alt', selector: '[id="photo"]', component: '/src/Photo.vue', help: 'https://example.test' }]);
        expect(JSON.parse(JSON.stringify(results)).issues[0]).not.toHaveProperty('element');
    });

    it('no prompt without issues', () => {
        expect(pageResults([]).prompt).toBe('');
    });
});

describe('ids and changes between runs', () => {
    const run = (...issues: Array<[string, string?]>) => issueIds(issues.map(([ruleId, selector]) => ({ ruleId, selector })));

    it('same rule and selector, same id; repeats get #2, #3 in order', () => {
        const first = run(['image-alt', 'img'], ['html-lang'], ['image-alt', 'img'], ['link-text', 'a']);
        expect(first).toEqual(['image-alt img', 'html-lang', 'image-alt img #2', 'link-text a']);
        expect(run(['html-lang'], ['image-alt', 'img'], ['image-alt', 'img'], ['link-text', 'a'])).toEqual(expect.arrayContaining(first));
    });

    it('an issue that went away is fixed, one that came is new, the others remain', () => {
        const issue = (id: string) => ({ id, ruleId: id.split(' ')[0], severity: 'error' as const, message: id });
        expect(changes([issue('image-alt img'), issue('html-lang')], [issue('html-lang'), issue('link-text a')]))
            .toEqual({ fixed: ['image-alt img'], new: ['link-text a'], remaining: ['html-lang'] });
    });
});
