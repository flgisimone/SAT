export function createExpandableItem(message: string, color: string): HTMLLIElement {
    const li = document.createElement("li");
    li.style.color = color;
    li.style.marginBottom = "6px";

    const isLong = message.length > 120;
    const fullText = message;
    const shortText = message.slice(0, 120) + "…";

    const textSpan = document.createElement("span");
    textSpan.textContent = isLong ? shortText : fullText;

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = isLong ? "Mostra tutto" : "";
    toggleBtn.style.marginLeft = "6px";
    toggleBtn.style.cursor = "pointer";
    toggleBtn.style.fontSize = "12px";
    toggleBtn.style.border = "none";
    toggleBtn.style.background = "none";
    toggleBtn.style.color = "#007acc";

    let expanded = false;

    toggleBtn.addEventListener("click", () => {
        expanded = !expanded;
        textSpan.textContent = expanded ? fullText : shortText;
        toggleBtn.textContent = expanded ? "Nascondi" : "Mostra tutto";
    });

    li.appendChild(textSpan);
    if (isLong) li.appendChild(toggleBtn);

    return li;
}
