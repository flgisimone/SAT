const dts = require('rollup-plugin-dts').default;

module.exports = [
    {
        input: 'src/core/seoAccessibilityTool.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'es',
        },
        plugins: [dts()],
    },
    {
        input: 'src/react/useSeoAccessibilityTool.tsx',
        output: {
            file: 'dist/react.d.ts',
            format: 'es',
        },
        plugins: [dts()],
    },
    {
        input: 'src/vue/useSeoAccessibilityTool.ts',
        output: {
            file: 'dist/vue.d.ts',
            format: 'es',
        },
        plugins: [dts()],
    },
];
