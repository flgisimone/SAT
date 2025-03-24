import { useEffect } from 'react';
import { useSAT } from '../core/seoAccessibilityTool';
import { SATOptions } from "../satOptions";

export interface UseSATReactProps {
    options?: Partial<SATOptions>;
}

export function useSATReact({options = {} }: UseSATReactProps):void{
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        const runSAT = async () => {
            try {
                await useSAT(options);

                timeout = setTimeout(async () => {
                    try {
                        await useSAT(options);
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
    }, [options]);
}