import { seoAccessibilityTool } from "../core/seoAccessibilityTool";
import { headingOutline } from "../core/rules/headings";
import type { Issue } from "./issue";
import type { SATOptions } from "./satOptions";
import { createSATUI } from "../ui/satUI";
import { createFixController } from "./aiFix";

let satHasRun = false;

const RUN_FAILED = "Error while running SAT.";
const STORAGE_KEY = "sat-enabled";
/** Time the app gets to render the new route before the checks run again. */
const ROUTE_DELAY = 300;

/**
 * Bundlers (Vite, webpack, Next…) replace `process.env.NODE_ENV` at build time.
 * Without a bundler `process` doesn't exist, so SAT stays off instead of throwing.
 */
function isDevelopment(): boolean {
    try {
        return process.env.NODE_ENV === "development";
    } catch {
        return false;
    }
}

/** SAT stays on across reloads: the flag is the only thing stored. */
function storeEnabled(enabled: boolean): void {
    try {
        if (enabled) localStorage.setItem(STORAGE_KEY, "true");
        else localStorage.removeItem(STORAGE_KEY);
    } catch {
        // storage unavailable (private mode, quota): SAT just starts off on reload
    }
}

function storedEnabled(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
        return false;
    }
}

/**
 * Calls `listener` when a single-page app changes route: back/forward (`popstate`)
 * and `history.pushState`/`replaceState`, wrapped once. Changes of the hash alone are ignored.
 */
function onRouteChange(listener: () => void): void {
    const route = () => location.pathname + location.search;
    let last = route();
    const check = () => {
        if (route() === last) return;
        last = route();
        listener();
    };

    window.addEventListener("popstate", check);
    for (const method of ["pushState", "replaceState"] as const) {
        const original = history[method];
        history[method] = function (this: History, ...args: Parameters<History["pushState"]>) {
            original.apply(this, args);
            check();
        };
    }
}

export function satChecker(customOptions: Partial<SATOptions> = {}): void {
    if (satHasRun) return;
    if (!(customOptions.enabled ?? isDevelopment())) return;
    if (document.querySelector("sat-panel")) return;

    satHasRun = true;

    let running = false;
    let runId = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
        const id = ++runId;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        let issues: Issue[];
        const startTime = performance.now();
        try {
            issues = (await seoAccessibilityTool(customOptions)).issues;
        } catch {
            issues = [{ ruleId: "sat", severity: "error", category: "a11y", message: RUN_FAILED }];
        }

        // Stopped, or a newer run started while this one waited (e.g. on link-broken requests).
        if (!running || id !== runId) return;
        ui.showResults(issues, headingOutline(document), performance.now() - startTime);
        fixer?.checked(issues);
    };

    const runSoon = (delay: number) => {
        clearTimeout(timer);
        timer = setTimeout(run, delay);
    };

    const domObserver = customOptions.observeDom
        ? new MutationObserver(() => runSoon(customOptions.observeDom!))
        : null;

    const start = () => {
        running = true;
        storeEnabled(true);
        ui.setRunning(true);
        domObserver?.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
        fixer?.resume();
        return run();
    };

    const stop = () => {
        running = false;
        clearTimeout(timer);
        domObserver?.disconnect();
        storeEnabled(false);
        ui.setRunning(false);
    };

    const ui = createSATUI(() => (running ? stop() : start()), run, customOptions.aiFix && {
        fix: (issues) => fixer!.fix(issues),
        cancel: () => fixer!.cancel(),
    });
    const fixer = customOptions.aiFix && createFixController(customOptions.aiFix, ui.showFix, run);

    onRouteChange(() => {
        if (!running) return;
        ui.clearHighlights(); // the old page's elements are gone
        runSoon(ROUTE_DELAY);
    });

    document.body.appendChild(ui.host);
    ui.setRunning(false);
    if (storedEnabled()) start();
}
