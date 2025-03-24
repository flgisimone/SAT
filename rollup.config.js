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

    // React
    {
        input: 'src/react/useSeoAccessibilityTool.ts',
        output: {
            file: 'dist/react.js',
            format: 'esm',
            sourcemap: true
        },
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false
            })
        ],
        external: ['react']
    },

    // Vue
    {
        input: 'src/vue/useSeoAccessibilityTool.ts',
        output: {
            file: 'dist/vue.js',
            format: 'esm',
            sourcemap: true
        },
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false
            })
        ],
        external: ['vue']
    },

    // SAT Controller (UI button, toggle)
    {
        input: 'src/sat/satController.ts',
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
    }
];
