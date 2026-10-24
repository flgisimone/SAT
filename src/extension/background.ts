// Service worker of the browser extension: a click on its button adds SAT to the tab.
// `activeTab` gives access to that tab only, on the click: the extension reads no other page.

/** The few `chrome.*` APIs used here, instead of a dependency on @types/chrome. */
declare const chrome: {
    action: { onClicked: { addListener(listener: (tab: { id?: number }) => void): void } };
    scripting: { executeScript(injection: { target: { tabId: number }; files: string[]; world: 'MAIN' }): Promise<unknown> };
};

chrome.action.onClicked.addListener((tab) => {
    if (tab.id === undefined) return;
    // The page's own world, as an app would load SAT: route changes of single-page apps are seen.
    chrome.scripting
        .executeScript({ target: { tabId: tab.id }, files: ['sat.js'], world: 'MAIN' })
        .catch(() => {}); // pages extensions can't run on (chrome://, the web store): nothing to do
});
