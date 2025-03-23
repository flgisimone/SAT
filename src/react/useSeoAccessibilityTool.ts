import { useEffect } from 'react';
import { useSAT } from '../core/seoAccessibilityTool';
import { SATOptions } from "../satOptions";

export interface UseSATReactProps {
    enable?: boolean;
    options?: Partial<SATOptions>;
}

export const useSATReact = ({ enable = true, options = {} }: UseSATReactProps) => {
    useEffect(() => {
        useSAT(enable, options);

        const timeout = setTimeout(() => {
            useSAT(enable, options);
        }, 100);

        return () => clearTimeout(timeout);
    }, [enable, options]);
};
