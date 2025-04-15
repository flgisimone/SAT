import typescript from '@rollup/plugin-typescript';

export default [
    // Core (Vanilla / Shared)
    {
        input: 'src/core/seoAccessibilityTool.ts',
        output: {
            file: 'dist/index.js',
            format: 'esm',
            sourcemap: true
        },
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false // Type declarations handled separately
            })
        ]
    },

    // SAT Controller (UI button, toggle)
    {
        input: 'src/sat/satChecker.ts',
        output: {
            file: 'dist/sat-controller.js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false,
            }),
        ],
    },

    // React Hook
    {
        input: 'src/integrations/react.ts',
        output: {
            file: 'dist/react.js',
            format: 'esm',
            sourcemap: true,
        },
        external: ['react'],
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false,
            }),
        ],
    },

    // Vue Composable
    {
        input: 'src/integrations/vue.ts',
        output: {
            file: 'dist/vue.js',
            format: 'esm',
            sourcemap: true,
        },
        external: ['vue'],
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false,
            }),
        ],
    },
];
