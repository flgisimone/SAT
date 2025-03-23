import typescript from '@rollup/plugin-typescript';

export default [
    {
        input: 'src/core/seoAccessibilityTool.ts',
        output: {
            file: 'dist/index.js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false,
                declarationDir: null,
            }),
        ],
    },
    {
        input: 'src/react/useSeoAccessibilityTool.ts',
        output: {
            file: 'dist/react.js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false,
                declarationDir: null,
            }),
        ],
        external: ['react'],
    },
    {
        input: 'src/vue/useSeoAccessibilityTool.ts',
        output: {
            file: 'dist/vue.js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false,
                declarationDir: null,
            }),
        ],
        external: ['vue'],
    }
];
