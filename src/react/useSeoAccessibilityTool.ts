import { useEffect } from 'react';
import { useSAT } from "../core/seoAccessibilityTool";

export function useSATReact(enable = false):void {
    useEffect(() => {
        useSAT(enable);

        const timeout = setTimeout(() => {
            useSAT(enable);
        }, 100);

        return () => clearTimeout(timeout);
    }, []);
};

export default useSATReact;
