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
        input: 'src/sat/satController.ts',
        output: {
            file: 'dist/sat-controller.d.ts',
            format: 'es',
        },
        plugins: [dts()],
    },
];
