import { onMounted, onUnmounted } from 'vue';
import { useSAT } from '../core/seoAccessibilityTool';
import { SATOptions } from "../satOptions";

export interface UseSATVueProps {
    enable?: boolean;
    options?: Partial<SATOptions>;
}

export function useSATVue({ enable = true, options = {} }: UseSATVueProps) {
    let timeout: ReturnType<typeof setTimeout>;

    const runSAT = async () => {
        try {
            await useSAT(enable, options);

            timeout = setTimeout(async () => {
                try {
                    await useSAT(enable, options);
                } catch (error) {
                    console.error('❌ Error during SAT re-run:', error);
                }
            }, 100);
        } catch (error) {
            console.error('❌ Error during SAT run:', error);
        }
    };

    onMounted(() => {
        runSAT();
    });

    onUnmounted(() => {
        clearTimeout(timeout);
    });
}
