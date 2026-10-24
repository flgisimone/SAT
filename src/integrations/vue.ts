import { getCurrentInstance, onMounted } from "vue";
import { satChecker } from "../sat/satChecker";
import type { SATOptions } from "../sat/satOptions";

export type { SATOptions } from "../sat/satOptions";

/**
 * Starts SAT. Call it in `setup()` / `<script setup>`: it waits for the component to mount.
 * Called outside a component (e.g. after the app is mounted), it starts immediately.
 */
export function useSatChecker(customOptions?: Partial<SATOptions>) {
    const start = () => {
        if (!window.__SAT_INIT__) {
            window.__SAT_INIT__ = true;
            satChecker(customOptions);
        }
    };

    if (getCurrentInstance()) {
        onMounted(start);
    } else {
        start();
    }
}
