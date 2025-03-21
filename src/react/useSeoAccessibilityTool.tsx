import { useEffect } from 'react';
import { useSAT } from "../core/seoAccessibilityTool";

export interface IProp {
    delay?: number;
    enable: boolean;
}

export const useSATReact = (delay = 100, enable = false) => {
    useEffect(() => {
        useSAT(enable);

        const timeout = setTimeout(() => {
            useSAT(enable);
        }, delay);

        return () => clearTimeout(timeout);
    }, []);
};

export default useSATReact;
