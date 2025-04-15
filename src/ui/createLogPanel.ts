import { createPanel } from './createPanel';

export function createLogPanel(): {
    logPanel: HTMLDivElement;
    errorListPanel: HTMLDivElement;
    warningListPanel: HTMLDivElement;
    toggleErrorList: () => void;
    toggleWarningList: () => void;
    setVisibility: (hasErrors: boolean, hasWarnings: boolean) => void;
} {
    const logPanel = document.createElement("div");

    Object.assign(logPanel.style, {
        position: "fixed",
        bottom: "10px",
        right: "10px",
        backgroundColor: "#fff",
        boxShadow: "0 0 10px rgba(0,0,0,0.3)",
        padding: "10px",
        borderRadius: "10px",
        fontSize: "14px",
        zIndex: "10000",
        gap: "10px",
        width: "auto",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        visibility: "hidden",
        display: "none"
    });

    const fadeIn = (el: HTMLElement) => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.3s ease';
        el.style.display = 'block';
        requestAnimationFrame(() => {
            el.style.opacity = '1';
        });
    };

    const fadeOut = (el: HTMLElement) => {
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0';
        setTimeout(() => {
            el.style.display = 'none';
        }, 300);
    };

    const { panel: errorListPanel, toggleBtn: closeErrorBtn } = createPanel("Errors", "red");
    const { panel: warningListPanel, toggleBtn: closeWarningBtn } = createPanel("Warnings", "orange");

    const toggleErrorList = () => {
        errorListPanel.style.display === "none" ? fadeIn(errorListPanel) : fadeOut(errorListPanel);
    };

    const toggleWarningList = () => {
        warningListPanel.style.display === "none" ? fadeIn(warningListPanel) : fadeOut(warningListPanel);
    };

    closeErrorBtn.addEventListener("click", () => fadeOut(errorListPanel));
    closeWarningBtn.addEventListener("click", () => fadeOut(warningListPanel));

    const setVisibility = (hasErrors: boolean, hasWarnings: boolean) => {
        const shouldShow = hasErrors || hasWarnings;
        logPanel.style.display = shouldShow ? "flex" : "none";
        logPanel.style.visibility = shouldShow ? "visible" : "hidden";
    };

    logPanel.appendChild(errorListPanel);
    logPanel.appendChild(warningListPanel);

    return {
        logPanel,
        errorListPanel,
        warningListPanel,
        toggleErrorList,
        toggleWarningList,
        setVisibility
    };
}
