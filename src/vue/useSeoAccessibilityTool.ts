import { onMounted, onUnmounted } from 'vue';
import { useSAT } from '../core/seoAccessibilityTool';
import { SATOptions } from "../satOptions";

export interface UseSATVueProps {
    enable?: boolean;
    options?: Partial<SATOptions>;
}

export function useSATVue({ enable = true, options = {} }: UseSATVueProps) {
    let timeout: number;

    onMounted(() => {
        useSAT(enable, options);

        timeout = window.setTimeout(() => {
            useSAT(enable, options);
        }, 100);
    });

    onUnmounted(() => {
        clearTimeout(timeout);
    });
}
