import { readFileSync } from 'node:fs';
import typescript from '@rollup/plugin-typescript';

const ts = () => typescript({
    tsconfig: './tsconfig.json',
    declaration: false, // type declarations (with the doc comments) are built by rollup.dts.config.cjs
    removeComments: true,
});

// One build for all entry points: the shared code goes into a single chunk,
// so importing two entry points loads (and keeps the state of) SAT once.
const input = {
    index: 'src/core/seoAccessibilityTool.ts',
    'sat-controller': 'src/sat/satChecker.ts',
    react: 'src/integrations/react.ts',
    vue: 'src/integrations/vue.ts',
    vite: 'src/integrations/vite.ts',
    axe: 'src/engines/axe.ts',
    playwright: 'src/headless/playwright.ts',
    cli: 'src/headless/cli.ts',
};

/** In the injected script axe-core is the `window.axe` the Playwright helper adds, looked up at run time. */
const axeFromWindow = {
    name: 'axe-from-window',
    resolveId: (id) => (id === 'axe-core' ? '\0axe-core' : null),
    load: (id) => (id === '\0axe-core' ? 'export default { run: (...args) => window.axe.run(...args) };' : null),
};

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

/** Manifest of the browser extension, with the package's version. */
const extensionManifest = {
    name: 'extension-manifest',
    generateBundle() {
        const manifest = {
            manifest_version: 3,
            name: 'SAT - SEO Accessibility Tool',
            version,
            description: 'Checks the open page for SEO and accessibility issues. Nothing leaves the browser.',
            action: { default_title: 'Check this page with SAT' },
            background: { service_worker: 'background.js' },
            permissions: ['activeTab', 'scripting'],
        };
        this.emitFile({ type: 'asset', fileName: 'manifest.json', source: JSON.stringify(manifest, null, 2) });
    },
};

export default [
    {
        input,
        output: {
            dir: 'dist',
            format: 'esm',
            sourcemap: true,
            entryFileNames: '[name].js',
            chunkFileNames: 'chunks/[name].js',
            banner: (chunk) => (chunk.name === 'cli' ? '#!/usr/bin/env node' : ''),
            // The axe entry needs only satDom: keep the shared code in one chunk anyway, one request.
            manualChunks: (id) => (/[\\/]src[\\/](core|sat)[\\/]/.test(id) && !id.endsWith('satChecker.ts') ? 'seoAccessibilityTool' : undefined),
        },
        external: ['react', 'vue', 'vite', 'axe-core', '@playwright/test', /^node:/],
        plugins: [ts()],
    },
    {
        // Standalone script the Playwright helper and the CLI add to the page under test.
        input: 'src/headless/inject.ts',
        output: { file: 'dist/sat-inject.js', format: 'iife' },
        plugins: [axeFromWindow, ts()],
    },
    {
        // Browser extension (load dist/extension unpacked): the script its button adds to the page…
        input: 'src/extension/sat.ts',
        output: { file: 'dist/extension/sat.js', format: 'iife' },
        plugins: [ts()],
    },
    {
        // …and its service worker, with the manifest.
        input: 'src/extension/background.ts',
        output: { file: 'dist/extension/background.js', format: 'iife' },
        plugins: [ts(), extensionManifest],
    },
];
