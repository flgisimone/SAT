import { useEffect } from 'react';
import { useSAT, HeadingOrderOptions } from "../core/seoAccessibilityTool";

export interface UseHeadingOrderOptions extends HeadingOrderOptions {
    delay?: number;
}

export const useSATReact = ({ delay = 100, callback }: UseHeadingOrderOptions = {}) => {
    useEffect(() => {
        useSAT({ callback });

        const timeout = setTimeout(() => {
            useSAT({ callback });
        }, delay);

        return () => clearTimeout(timeout);
    }, []);
};

export default useSATReact;
