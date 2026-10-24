import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { compile } from 'svelte/compiler';
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

    it('without the metadata (React, plain HTML, production builds) there is no component', () => {
        document.body.innerHTML = '<main><img src="a.png"></main>';
        const img = document.querySelector('img')!;
        expect(componentSource(img)).toBeUndefined();
        expect(fixPrompt(issueOn(img))).not.toContain('Component:');
    });
});
