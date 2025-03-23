import { onMounted, onUnmounted } from 'vue';
import { useSAT } from '../core/seoAccessibilityTool';
import { SATOptions } from "../satOptions";

export interface UseSATVueProps {
    enable?: boolean;
    options?: Partial<SATOptions>;
}

export function useSATVue({ enable = true, options = {} }: UseSATVueProps) {
    let observer: MutationObserver | null = null;

    const runSAT = async () => {
        try {
            await useSAT(enable, options);
        } catch (error) {
            console.error('❌ Error during SAT run:', error);
        }
    };

    onMounted(() => {
        if (!enable) return;

        // Run immediately on mount
        runSAT();

        // Create a MutationObserver for DOM changes
        observer = new MutationObserver(() => {
            runSAT();
        });

        // Start observing the DOM
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
        });
    });

    onUnmounted(() => {
        if (observer) {
            observer.disconnect();
        }
    });
}
