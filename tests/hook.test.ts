// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { hookOutput } from '../src/headless/hook';

// sat-check hook with a fake event and a fake dev server.

const event = (file_path: string) => JSON.stringify({ hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path } });
const IMG = { id: 'image-alt img', ruleId: 'image-alt', severity: 'error', message: 'Image without alt', component: 'src/App.tsx:12' };
const LINK = { id: 'link-text a', ruleId: 'link-text', severity: 'warning', message: 'Link text "more"' };

function server(pages: Record<string, unknown>) {
    const asked: string[] = [];
    const fake = (async (_url: string, init: RequestInit) => {
        const { params } = JSON.parse(String(init.body));
        asked.push(params.arguments.url);
        const page = pages[params.arguments.url];
        return Response.json({ jsonrpc: '2.0', id: 1, result: page ? { content: [], structuredContent: { pages: [page] } } : { isError: true, content: [] } });
    }) as typeof fetch;
    return { fake, asked };
}

const additional = (output: string | undefined) => JSON.parse(output!).hookSpecificOutput.additionalContext as string;

describe('sat-check hook', () => {
    it('says nothing when the dev server is off', async () => {
        const off = (async () => { throw new TypeError('fetch failed'); }) as typeof fetch;
        expect(await hookOutput(event('/app/src/App.tsx'), { mcp: 'http://localhost:5173/__sat/mcp', routes: ['/'], fetch: off })).toBeUndefined();
    });

    it('checks only after edits to UI files, and says nothing without new issues', async () => {
        const { fake, asked } = server({ '/': { url: 'http://localhost:5173/', issues: [IMG], changes: { fixed: [], new: [], remaining: ['image-alt img'] } } });
        expect(await hookOutput(event('/app/src/api.ts'), { mcp: 'x', routes: ['/'], fetch: fake })).toBeUndefined();
        expect(await hookOutput('not json', { mcp: 'x', routes: ['/'], fetch: fake })).toBeUndefined();
        expect(asked).toEqual([]);

        expect(await hookOutput(event('/app/src/App.tsx'), { mcp: 'x', routes: ['/'], fetch: fake })).toBeUndefined();
        expect(asked).toEqual(['/']);
    });

    it('gives the agent the new issues of each route', async () => {
        const { fake } = server({
            '/': { url: 'http://localhost:5173/', issues: [IMG, LINK], changes: { fixed: [], new: ['image-alt img'], remaining: ['link-text a'] } },
            '/cart': { url: 'http://localhost:5173/cart', issues: [LINK] },
        });
        const output = await hookOutput(event('/app/src/App.vue'), { mcp: 'x', routes: ['/', '/cart', '/down'], fetch: fake });

        expect(JSON.parse(output!).hookSpecificOutput.hookEventName).toBe('PostToolUse');
        const text = additional(output);
        const [home, cart] = text.split('\n\n');
        expect(home).toBe('SAT: your edit added 1 issue on /.\n- error image-alt: Image without alt (src/App.tsx:12)');
        expect(cart).toBe('SAT, first check of /cart since vite dev started: 1 issue, some may be older than your edit.\n- warning link-text: Link text "more"');
        expect(text).toContain('sat_rule');
    });
});
