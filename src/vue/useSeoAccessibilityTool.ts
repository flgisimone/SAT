import { onMounted, onUnmounted } from 'vue';
import { useSAT } from '../core/seoAccessibilityTool';
import { SATOptions } from "../satOptions";

export interface UseSATVueProps {
    options?: Partial<SATOptions>;
}

export function useSATVue({ options = {} }: UseSATVueProps) {
    let timeout: ReturnType<typeof setTimeout>;

    const runSAT = async () => {
        try {
            await useSAT(options);

            timeout = setTimeout(async () => {
                try {
                    await useSAT(options);
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
