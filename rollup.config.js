import typescript from '@rollup/plugin-typescript';

export default {
    input: {
        index: 'src/core/seoAccessibilityTool.ts',
        react: 'src/react/useSeoAccessibilityTool.tsx',
        vue: 'src/vue/useSeoAccessibilityTool.ts'
    },
    output: [
        {
            dir: 'dist',
            format: 'esm',
            entryFileNames: '[name].js'
        }
    ],
    plugins: [typescript({ tsconfig: './tsconfig.json' })],
    external: ['react', 'vue']
};
