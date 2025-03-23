import { useEffect } from 'react';
import { useSAT } from '../core/seoAccessibilityTool';
import { SATOptions } from "../satOptions";

export interface UseSATReactProps {
    enable?: boolean;
    options?: Partial<SATOptions>;
}

export function useSATReact({ enable = true, options = {} }: UseSATReactProps):void{
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        const runSAT = async () => {
            try {
                await useSAT(enable, options);

                timeout = setTimeout(async () => {
                    try {
                        await useSAT(enable, options);
                    } catch (error) {
                        console.error("❌ Error during SAT re-run:", error);
                    }
                }, 100);
            } catch (error) {
                console.error("❌ Error during SAT run:", error);
            }
        };

        runSAT();

        return () => {
            clearTimeout(timeout);
        };
    }, [enable, options]);
}