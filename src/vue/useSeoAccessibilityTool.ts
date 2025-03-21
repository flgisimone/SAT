import { onMounted, onUnmounted } from 'vue';
import { useSAT } from "../core/seoAccessibilityTool";

export interface IProp {
    delay?: number;
    enable: boolean;
}

export function useSATVue(delay = 100, enable = false) {
    let timeout: number;

    onMounted(() => {
        useSAT(enable);

        timeout = window.setTimeout(() => {
            useSAT(enable);
        }, delay);
    });

    onUnmounted(() => {
        clearTimeout(timeout);
    });
}
