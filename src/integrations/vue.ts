import { onMounted } from "vue";
import { satChecker } from "../sat/satChecker";

export function useSatChecker(customOptions?: any) {
    onMounted(() => {
        if (!window.__SAT_INIT__) {
            window.__SAT_INIT__ = true;
            satChecker(customOptions);
        }
    });
}
