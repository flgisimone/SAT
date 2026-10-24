const dts = require('rollup-plugin-dts').default;

// Same entry points as rollup.config.js.
module.exports = {
    input: {
        index: 'src/core/seoAccessibilityTool.ts',
        'sat-controller': 'src/sat/satChecker.ts',
        react: 'src/integrations/react.ts',
        vue: 'src/integrations/vue.ts',
        vite: 'src/integrations/vite.ts',
        axe: 'src/engines/axe.ts',
        playwright: 'src/headless/playwright.ts',
    },
    output: { dir: 'dist', format: 'es', entryFileNames: '[name].d.ts', chunkFileNames: 'chunks/[name].d.ts' },
    external: ['react', 'vue', 'vite', 'axe-core', '@playwright/test', /^node:/],
    plugins: [dts()],
};
