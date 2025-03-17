import { useEffect } from 'react';
import { useSAT } from "../core/seoAccessibilityTool";

export interface IProp {
    delay?: number;
}

export const useSATReact = ({ delay = 100 }: IProp = {}) => {
    useEffect(() => {
        useSAT();

        const timeout = setTimeout(() => {
            useSAT();
        }, delay);

        return () => clearTimeout(timeout);
    }, []);
};

export default useSATReact;
