import { createLogPanel } from "./createLogPanel";

export function createSATUI(
    onRunClick: () => void,
    onReloadClick: () => void
): {
    wrapper: HTMLDivElement;
    runButton: HTMLButtonElement;
    logPanel: HTMLDivElement;
    errorListPanel: HTMLDivElement;
    warningListPanel: HTMLDivElement;
    errorToggleButton: HTMLButtonElement;
    warningToggleButton: HTMLButtonElement;
    reloadButton: HTMLButtonElement;
    updateLogCounts: (errors: number, warnings: number) => void;
    toggleErrorList: () => void;
    toggleWarningList: () => void;
    setVisibility: (hasErrors: boolean, hasWarnings: boolean) => void
} {
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.backgroundColor = "#ffffff";
    wrapper.style.border = "1px solid #43d8d5";
    wrapper.style.top = "35%";
    wrapper.style.left = "2px";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.gap = "10px";
    wrapper.style.zIndex = "10000";
    wrapper.style.padding = "20px 10px";
    wrapper.style.borderRadius = "20px";
    wrapper.setAttribute("data-sat-ignore", "true");

    const buttonStyle = {
        padding: "10px 16px",
        backgroundColor: "#ffffff",
        color: "#000000",
        border: "#43d8d5",
        borderRadius: "50%",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        cursor: "pointer",
        fontSize: "20px",
    };

    const runButton = document.createElement("button");
    runButton.textContent = "🚀";
    Object.assign(runButton.style, buttonStyle);

    const reloadButton = document.createElement("button");
    reloadButton.textContent = "🔃";
    Object.assign(reloadButton.style, buttonStyle);

    const errorToggleButton = document.createElement("button");
    errorToggleButton.textContent = "❗ 0";
    Object.assign(errorToggleButton.style, buttonStyle);
    errorToggleButton.style.display = "none";

    const warningToggleButton = document.createElement("button");
    warningToggleButton.textContent = "⚠️ 0";
    Object.assign(warningToggleButton.style, buttonStyle);
    warningToggleButton.style.display = "none";

    const {
        logPanel,
        errorListPanel,
        warningListPanel,
        toggleErrorList,
        toggleWarningList,
        setVisibility
    } = createLogPanel();

    errorToggleButton.addEventListener("click", toggleErrorList);
    warningToggleButton.addEventListener("click", toggleWarningList);

    wrapper.append(runButton, reloadButton, errorToggleButton, warningToggleButton);
    runButton.addEventListener("click", onRunClick);
    reloadButton.addEventListener("click", onReloadClick);

    const updateLogCounts = (errors: number, warnings: number) => {
        errorToggleButton.textContent = `❗ ${errors}`;
        warningToggleButton.textContent = `⚠️ ${warnings}`;

        errorToggleButton.style.display = errors > 0 ? "block" : "none";
        warningToggleButton.style.display = warnings > 0 ? "block" : "none";
    };

    return {
        wrapper,
        runButton,
        logPanel,
        errorListPanel,
        warningListPanel,
        errorToggleButton,
        warningToggleButton,
        reloadButton,
        updateLogCounts,
        toggleErrorList,
        toggleWarningList,
        setVisibility
    };
}
