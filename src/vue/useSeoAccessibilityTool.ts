import { onMounted, onUnmounted } from 'vue';
import { useSAT } from "../core/seoAccessibilityTool";

export interface IProp {
    delay?: number;
}

export function useSATVue({ delay = 100 }: IProp = {}) {
    let timeout: number;

    onMounted(() => {
        useSAT();

        timeout = window.setTimeout(() => {
            useSAT();
        }, delay);
    });

    onUnmounted(() => {
        clearTimeout(timeout);
    });
}
