import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compile } from 'svelte/compiler';
import { transformWithOxc } from 'vite';
import { prepareReactSources, sourceLine } from '../src/core/reactSource';
import { createApp, h } from 'vue';
import { componentSource, fixPrompt } from '../src/core/fixPrompt';
import type { Issue } from '../src/sat/issue';

// Components rendered in development by the real frameworks: SAT reads what they attach to elements.

const issueOn = (element: Element): Issue => ({ ruleId: 'image-alt', severity: 'error', category: 'a11y', message: 'No alt', element });

// Compiled modules go next to the tests, so `svelte/internal/client` resolves from node_modules.
const tmp = mkdtempSync(join(__dirname, '.svelte-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
});

describe('componentSource', () => {
    it('Vue: the file of the component whose template has the element', () => {
        // @vitejs/plugin-vue sets __file in development.
        const Hero = { __file: '/project/src/components/Hero.vue', render: () => h('section', [h('img', { src: 'a.png' })]) };
        createApp({ render: () => h('main', [h(Hero)]) }).mount('#app');

        const img = document.querySelector('img')!;
        expect(componentSource(img)).toBe('/project/src/components/Hero.vue');
        expect(fixPrompt(issueOn(img))).toContain('Component: /project/src/components/Hero.vue\n');
        // The app's root component has no __file: no component.
        expect(componentSource(document.querySelector('main')!)).toBeUndefined();
    });

    it('Svelte: the file and line of the element', async () => {
        const source = '<script>let { src } = $props();</script>\n<section>\n  <img {src}>\n</section>\n';
        const { js } = compile(source, { dev: true, filename: 'src/lib/Hero.svelte', generate: 'client' });
        const file = join(tmp, 'Hero.js');
        writeFileSync(file, js.code);
        // The browser build of `mount`: without the `browser` condition, `svelte` resolves to the server one.
        const { mount } = await import('../node_modules/svelte/src/index-client.js');
        const Hero = (await import(/* @vite-ignore */ file)).default;
        mount(Hero, { target: document.querySelector('#app')!, props: { src: 'a.png' } });

        const img = document.querySelector('img')!;
        expect(componentSource(img)).toBe('src/lib/Hero.svelte:3');
        expect(fixPrompt(issueOn(img))).toContain('Component: src/lib/Hero.svelte:3\n');
    });

    it('without the metadata (plain HTML, production builds) there is no component', () => {
        document.body.innerHTML = '<main><img src="a.png"></main>';
        const img = document.querySelector('img')!;
        expect(componentSource(img)).toBeUndefined();
        expect(fixPrompt(issueOn(img))).not.toContain('Component:');
    });
});

describe('componentSource with React (the browser test with examples/react covers the real app)', () => {
    const SOURCE = 'export function Card() {\n  return (\n    <div>\n      <img id="x" />\n    </div>\n  );\n}\n';
    afterEach(() => vi.unstubAllGlobals());

    /** The module as Vite serves it in development: React's JSX transform, with the inline source map. */
    async function served() {
        const { code, map } = await transformWithOxc(SOURCE, 'Card.jsx', { jsx: { development: true } });
        return `${code}\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map)).toString('base64')}\n`;
    }

    /** Line and column (1-based) of the jsxDEV call of `tag` in the served code, as they appear in the stack. */
    function callAt(code: string, tag: string) {
        const lines = code.split('\n');
        const line = lines.findIndex((text) => text.includes(`jsxDEV("${tag}"`));
        return { line: line + 1, column: lines[line].indexOf(`jsxDEV("${tag}"`) + 1 };
    }

    /** An element as React 19 leaves it in development: the fiber with the stack of the jsxDEV call. */
    function rendered(at: { line: number; column: number }, module = 'Card.jsx?t=1', origin = location.origin) {
        const img = document.createElement('img');
        const stack = [
            'Error: react-stack-top-frame',
            `    at exports.jsxDEV (${origin}/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1:196:25)`,
            `    at Card (${origin}/src/${module}:${at.line}:${at.column})`,
            `    at Object.react_stack_bottom_frame (${origin}/node_modules/.vite/deps/react-dom_client.js?v=1:14139:12)`,
        ].join('\n');
        Object.assign(img, { __reactFiber$abc: { _debugStack: { stack } } });
        document.querySelector('#app')!.append(img);
        return img;
    }

    it('sourceLine maps a generated position to the line of the source', async () => {
        const { code, map } = await transformWithOxc(SOURCE, 'Card.jsx', { jsx: { development: true } });
        const img = callAt(code, 'img');
        const div = callAt(code, 'div');
        expect(sourceLine(map.mappings, img.line, img.column)).toBe(4);
        expect(sourceLine(map.mappings, div.line, div.column)).toBe(3);
        expect(sourceLine(map.mappings, 999, 1)).toBeUndefined();
    });

    it('React 19: the file from the stack at once, the line once the source map of the module is read', async () => {
        const code = await served();
        const fetched: string[] = [];
        vi.stubGlobal('fetch', async (url: string) => (fetched.push(String(url)), new Response(code)));
        const img = rendered(callAt(code, 'img'));

        expect(componentSource(img)).toBe('/src/Card.jsx');
        await prepareReactSources([img, img]);
        expect(componentSource(img)).toBe('/src/Card.jsx:4');
        expect(fixPrompt(issueOn(img))).toContain('Component: /src/Card.jsx:4\n');
        expect(fetched).toEqual([`${location.origin}/src/Card.jsx?t=1`]);
    });

    it('React 19: modules of another origin are never fetched', async () => {
        const fetch = vi.fn();
        vi.stubGlobal('fetch', fetch);
        const img = rendered({ line: 3, column: 5 }, 'Other.jsx', 'http://cdn.example');
        await prepareReactSources([img]);
        expect(fetch).not.toHaveBeenCalled();
        expect(componentSource(img)).toBe('/src/Other.jsx');
    });

    it('React 19: a module that cannot be fetched keeps the file only', async () => {
        vi.stubGlobal('fetch', async () => {
            throw new TypeError('offline');
        });
        const img = rendered({ line: 3, column: 5 }, 'Gone.jsx');
        await prepareReactSources([img]);
        expect(componentSource(img)).toBe('/src/Gone.jsx');
    });

    it('React 18: file and line from _debugSource', () => {
        const img = document.createElement('img');
        Object.assign(img, { __reactFiber$abc: { _debugSource: { fileName: '/project/src/Card.jsx', lineNumber: 4 } } });
        document.querySelector('#app')!.append(img);
        expect(componentSource(img)).toBe('/project/src/Card.jsx:4');
    });
});
