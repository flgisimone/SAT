import typescript from '@rollup/plugin-typescript';

// One build for all entry points: the shared code goes into a single chunk,
// so importing two entry points loads (and keeps the state of) SAT once.
const input = {
    index: 'src/core/seoAccessibilityTool.ts',
    'sat-controller': 'src/sat/satChecker.ts',
    react: 'src/integrations/react.ts',
    vue: 'src/integrations/vue.ts',
};

export default {
    input,
    output: {
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
    },
    external: ['react', 'vue'],
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
            declaration: false, // type declarations (with the doc comments) are built by rollup.dts.config.cjs
            removeComments: true,
        }),
    ],
};
