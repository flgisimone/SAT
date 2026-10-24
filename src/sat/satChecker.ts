import { seoAccessibilityTool } from "../core/seoAccessibilityTool";
import { SATOptions } from "./satOptions";
import { satReset } from "./satReset";
import { createSATUI } from "../ui/satUI";
import { createExpandableItem } from "../ui/createExpandableItem";

let satHasRun = false;

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

/** Results are stored per page, so another route doesn't show stale results. */
function storageKey(kind: "errors" | "warnings"): string {
    return `sat-${kind}:${window.location.pathname}`;
}

function readStored(kind: "errors" | "warnings"): string[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey(kind)) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeStored(kind: "errors" | "warnings", messages: string[] | null): void {
    try {
        if (messages === null) {
            localStorage.removeItem(storageKey(kind));
        } else {
            localStorage.setItem(storageKey(kind), JSON.stringify(messages));
        }
    } catch {
        // storage unavailable (private mode, quota): results just won't persist
    }
}

export function satChecker(customOptions?: Partial<SATOptions>): void {
    if (satHasRun) return;
    if (!isDevelopment()) return;
    if (document.getElementById("sat-run-button")) return;

    satHasRun = true;

    let satEnabled = false;

    const handleRunClick = async () => {
        if (satEnabled) {
            disableSAT();
        } else {
            await enableSAT();
        }
    };

    const handleReloadClick = async () => {
        satReset();
        await enableSAT();
    };

    const {
        wrapper,
        runButton,
        reloadButton,
        logPanel,
        errorListPanel,
        warningListPanel,
        updateLogCounts,
        setVisibility
    } = createSATUI(handleRunClick, handleReloadClick);

    runButton.id = "sat-run-button";
    reloadButton.style.display = "none";

    const enableSAT = async () => {
        try {
            errorListPanel.innerHTML = "";
            warningListPanel.innerHTML = "";

            await new Promise(resolve => requestAnimationFrame(() =>
                requestAnimationFrame(resolve)
            ));

            const result = await seoAccessibilityTool(customOptions);
            if (!result) throw new Error("Nessun risultato dal tool");

            const { errors, warnings, errorMessages, warningMessages } = result;

            writeStored("errors", errorMessages);
            writeStored("warnings", warningMessages);

            runButton.textContent = "🛑";
            runButton.setAttribute("aria-label", "Stop SAT and clear highlights");
            reloadButton.style.display = "block";
            satEnabled = true;

            updateLogCounts(errors, warnings);
            setVisibility(errors > 0, warnings > 0);

            renderMessages(errorMessages, warningMessages);
        } catch {
            const fallbackMsg = createExpandableItem("⚠️ Errore durante l'esecuzione del SAT.", "red");
            errorListPanel.innerHTML = "";
            errorListPanel.appendChild(fallbackMsg);

            writeStored("errors", ["Errore durante l'esecuzione del SAT."]);
            writeStored("warnings", null);

            updateLogCounts(1, 0);
            setVisibility(true, false);

            runButton.textContent = "🛑";
            runButton.setAttribute("aria-label", "Stop SAT and clear highlights");
            reloadButton.style.display = "block";
            satEnabled = true;
        }
    };

    const disableSAT = () => {
        satReset();
        runButton.textContent = "🚀";
        runButton.setAttribute("aria-label", "Run SAT checks");
        reloadButton.style.display = "none";
        satEnabled = false;

        errorListPanel.innerHTML = "";
        warningListPanel.innerHTML = "";
        updateLogCounts(0, 0);
        setVisibility(false, false);

        writeStored("errors", null);
        writeStored("warnings", null);
    };

    const renderMessages = (errors: string[], warnings: string[]) => {
        errorListPanel.innerHTML = "";
        warningListPanel.innerHTML = "";

        errors.forEach((msg) => {
            const li = createExpandableItem(msg, "red");
            errorListPanel.appendChild(li);
        });

        warnings.forEach((msg) => {
            const li = createExpandableItem(msg, "orange");
            warningListPanel.appendChild(li);
        });
    };

    const loadFromStorage = () => {
        const storedErrors = readStored("errors");
        const storedWarnings = readStored("warnings");

        if (storedErrors.length || storedWarnings.length) {
            runButton.textContent = "🛑";
            runButton.setAttribute("aria-label", "Stop SAT and clear highlights");
            reloadButton.style.display = "block";
            satEnabled = true;

            updateLogCounts(storedErrors.length, storedWarnings.length);
            setVisibility(storedErrors.length > 0, storedWarnings.length > 0);
            renderMessages(storedErrors, storedWarnings);
        }
    };

    document.body.appendChild(wrapper);
    document.body.appendChild(logPanel);

    loadFromStorage();
}
