import { onMounted, onUnmounted } from 'vue';
import { useSAT, HeadingOrderOptions } from "../core/seoAccessibilityTool";

export interface UseHeadingOrderOptions extends HeadingOrderOptions {
    delay?: number;
}

export function seoAccessibilityTool({ delay = 100, callback }: UseHeadingOrderOptions = {}) {
    let timeout: number;

    onMounted(() => {
        useSAT({ callback });

        timeout = window.setTimeout(() => {
            useSAT({ callback });
        }, delay);
    });

    onUnmounted(() => {
        clearTimeout(timeout);
    });
}