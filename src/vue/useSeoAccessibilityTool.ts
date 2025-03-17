import { onMounted, onUnmounted } from 'vue';
import { checkHeadingOrder, HeadingOrderOptions, h1Detected } from "../core/seoAccessibilityTool";

export interface UseHeadingOrderOptions extends HeadingOrderOptions {
    delay?: number;
}

export function useSAT({ delay = 100, callback }: UseHeadingOrderOptions = {}) {
    let timeout: number;

    onMounted(() => {
        checkHeadingOrder({ callback });

        timeout = window.setTimeout(() => {
            checkHeadingOrder({ callback });
        }, delay);
    });

    onUnmounted(() => {
        clearTimeout(timeout);
    });
}