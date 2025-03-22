import { useEffect } from 'react';
import { useSAT } from "../core/seoAccessibilityTool";

export const useSATReact = (enable = false) => {
    useEffect(() => {
        useSAT(enable);

        const timeout = setTimeout(() => {
            useSAT(enable);
        }, 100);

        return () => clearTimeout(timeout);
    }, []);
};

export default useSATReact;
