export function createPanel(titleText: string, color: string): {
    panel: HTMLDivElement;
    toggleBtn: HTMLButtonElement;
} {
    const panel = document.createElement("div");
    panel.style.display = "none";
    panel.style.width = "220px";
    panel.style.maxHeight = "300px";
    panel.style.overflowY = "auto";
    panel.style.border = `1px solid ${color}`;
    panel.style.padding = "8px";
    panel.style.borderRadius = "8px";
    panel.style.position = "relative";
    panel.style.transition = 'opacity 0.3s ease';

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "✖";
    toggleBtn.style.position = "absolute";
    toggleBtn.style.top = "4px";
    toggleBtn.style.right = "4px";
    toggleBtn.style.cursor = "pointer";
    toggleBtn.style.background = "transparent";
    toggleBtn.style.border = "none";
    toggleBtn.style.fontSize = "12px";

    panel.appendChild(toggleBtn);
    return { panel, toggleBtn };
}
