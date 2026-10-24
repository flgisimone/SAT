import { useEffect } from "react";
import { satChecker } from "../sat/satChecker";
import type { SATOptions } from "../sat/satOptions";

export type { SATOptions } from "../sat/satOptions";

export function useSATChecker(customOptions?: Partial<SATOptions>) {
    useEffect(() => {
        if (!window.__SAT_INIT__) {
            window.__SAT_INIT__ = true;
            satChecker(customOptions);
        }
    }, []);
}
