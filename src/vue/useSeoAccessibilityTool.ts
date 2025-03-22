import { onMounted, onUnmounted } from 'vue';
import { useSAT } from "../core/seoAccessibilityTool";


export function useSATVue(enable = false) {
    let timeout: number;

    onMounted(() => {
        useSAT(enable);

        timeout = window.setTimeout(() => {
            useSAT(enable);
        }, 100);
    });

    onUnmounted(() => {
        clearTimeout(timeout);
    });
}
