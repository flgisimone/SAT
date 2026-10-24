import typescript from '@rollup/plugin-typescript';

// One build for all entry points: the shared code goes into a single chunk,
// so importing two entry points loads (and keeps the state of) SAT once.
const input = {
    index: 'src/core/seoAccessibilityTool.ts',
    'sat-controller': 'src/sat/satChecker.ts',
    react: 'src/integrations/react.ts',
    vue: 'src/integrations/vue.ts',
    axe: 'src/engines/axe.ts',
};

export default {
    input,
    output: {
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        // The axe entry needs only satDom: keep the shared code in one chunk anyway, one request.
        manualChunks: (id) => (/[\\/]src[\\/](core|sat)[\\/]/.test(id) && !id.endsWith('satChecker.ts') ? 'seoAccessibilityTool' : undefined),
    },
    external: ['react', 'vue', 'axe-core'],
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
            declaration: false, // type declarations (with the doc comments) are built by rollup.dts.config.cjs
            removeComments: true,
        }),
    ],
};
