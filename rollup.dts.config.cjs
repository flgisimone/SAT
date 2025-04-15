const dts = require('rollup-plugin-dts').default;

module.exports = [
    {
        input: 'src/core/seoAccessibilityTool.ts',
        output: { file: 'dist/index.d.ts', format: 'es' },
        plugins: [dts()],
    },
    {
        input: 'src/sat/satChecker.ts',
        output: { file: 'dist/sat-controller.d.ts', format: 'es' },
        plugins: [dts()],
    },
    {
        input: 'src/integrations/react.ts',
        output: { file: 'dist/react.d.ts', format: 'es' },
        plugins: [dts()],
    },
    {
        input: 'src/integrations/vue.ts',
        output: { file: 'dist/vue.d.ts', format: 'es' },
        plugins: [dts()],
    },
];
