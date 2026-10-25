import { describe, expect, it } from 'vitest';
import type { Issue } from '../src/sat/issue';
import { pageResults } from '../src/sat/mcpResults';

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
        expect(results.issues).toEqual([{ ruleId: 'image-alt', severity: 'error', title: undefined, message: 'Image without alt', selector: '[id="photo"]', component: '/src/Photo.vue', help: 'https://example.test' }]);
        expect(JSON.parse(JSON.stringify(results)).issues[0]).not.toHaveProperty('element');
    });

    it('no prompt without issues', () => {
        expect(pageResults([]).prompt).toBe('');
    });
});
