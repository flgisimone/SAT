import { useEffect } from 'react';
import { checkHeadingOrder, HeadingOrderOptions } from "../core/seoAccessibilityTool";

export interface UseHeadingOrderOptions extends HeadingOrderOptions {
    delay?: number;
}

export const useSAT = ({ delay = 100, callback }: UseHeadingOrderOptions = {}) => {
    useEffect(() => {
        checkHeadingOrder({ callback });

        const timeout = setTimeout(() => {
            checkHeadingOrder({ callback });
        }, delay);

        return () => clearTimeout(timeout);
    }, []);
};

export default useSAT;
