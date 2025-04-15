import { useEffect } from "react";
import { satChecker } from "../sat/satChecker";

export function useSATChecker(customOptions?: any) {
    useEffect(() => {
        if (!window.__SAT_INIT__) {
            window.__SAT_INIT__ = true;
            satChecker(customOptions);
        }
    }, []);
}
