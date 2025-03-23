import { useEffect } from 'react';
import { useSAT } from '../core/seoAccessibilityTool';
import { SATOptions } from "../satOptions";

export interface UseSATReactProps {
    enable?: boolean;
    options?: Partial<SATOptions>;
}

export function useSATReact({enable = true, options = {}}: UseSATReactProps): void {
    useEffect(() => {
        if (!enable) return;

        const runSAT = async () => {
            try {
                await useSAT(enable, options);
            } catch (error) {
                console.error("❌ Error during SAT run:", error);
            }
        };

        // Initial run
        runSAT();

        // Observe DOM mutations
        const observer = new MutationObserver(() => {
            runSAT();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
        });

        return () => {
            observer.disconnect();
        };
    }, [enable, options]);
}
