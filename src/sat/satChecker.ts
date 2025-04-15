import { seoAccessibilityTool } from "../core/seoAccessibilityTool";
import { SATOptions } from "./satOptions";
import { satReset } from "./satReset";
import { createSATUI } from "../ui/satUI";
import { createExpandableItem } from "../ui/createExpandableItem";

let satHasRun = false;

export function satChecker(customOptions?: Partial<SATOptions>): void {
    if (satHasRun) return;
    if (process.env.NODE_ENV !== "development") return;
    if (document.getElementById("sat-run-button")) return;

    satHasRun = true;

    let satEnabled = false;

    const handleRunClick = async () => {
        satEnabled ? disableSAT() : await enableSAT();
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

            localStorage.setItem("sat-errors", JSON.stringify(errorMessages));
            localStorage.setItem("sat-warnings", JSON.stringify(warningMessages));

            runButton.textContent = "🛑";
            reloadButton.style.display = "block";
            satEnabled = true;

            updateLogCounts(errors, warnings);
            setVisibility(errors > 0, warnings > 0);

            renderMessages(errorMessages, warningMessages);
        } catch (err) {
            const fallbackMsg = createExpandableItem("⚠️ Errore durante l'esecuzione del SAT.", "red");
            errorListPanel.innerHTML = "";
            errorListPanel.appendChild(fallbackMsg);

            localStorage.setItem("sat-errors", JSON.stringify(["Errore durante l'esecuzione del SAT."]));
            localStorage.removeItem("sat-warnings");

            updateLogCounts(1, 0);
            setVisibility(true, false);

            runButton.textContent = "🛑";
            reloadButton.style.display = "block";
            satEnabled = true;
        }
    };

    const disableSAT = () => {
        satReset();
        runButton.textContent = "🔎";
        reloadButton.style.display = "none";
        satEnabled = false;

        errorListPanel.innerHTML = "";
        warningListPanel.innerHTML = "";
        updateLogCounts(0, 0);
        setVisibility(false, false);

        localStorage.removeItem("sat-errors");
        localStorage.removeItem("sat-warnings");
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
        const storedErrors: string[] = JSON.parse(localStorage.getItem("sat-errors") || "[]");
        const storedWarnings: string[] = JSON.parse(localStorage.getItem("sat-warnings") || "[]");

        if (storedErrors.length || storedWarnings.length) {
            runButton.textContent = "🛑";
            reloadButton.style.display = "block";
            satEnabled = true;

            updateLogCounts(storedErrors.length, storedWarnings.length);
            setVisibility(true, true);
            renderMessages(storedErrors, storedWarnings);
        }
    };

    document.body.appendChild(wrapper);
    document.body.appendChild(logPanel);

    loadFromStorage();
}
