const CONTEXT_MENU_ID = "save-contextual-clip";

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: "Save selection as task",
      contexts: ["selection"],
    });
  });
}

chrome.runtime.onInstalled.addListener(createContextMenu);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return;

  const text = (info.selectionText || "").trim();
  if (!text) return;

  chrome.storage.local.get(["tasks"], (result) => {
    const tasks = Array.isArray(result.tasks) ? result.tasks : [];
    const task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      url: info.pageUrl || tab?.url || "",
      sourceUrl: info.pageUrl || tab?.url || "",
      createdAt: new Date().toISOString(),
    };

    chrome.storage.local.set({ tasks: [task, ...tasks] });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "save-contextual-clip") return false;

  const text = typeof message.text === "string" ? message.text.trim() : "";
  if (!text) {
    sendResponse({ ok: false, error: "No text to save" });
    return true;
  }

  chrome.storage.local.get(["tasks"], (result) => {
    if (chrome.runtime.lastError) {
      sendResponse({ ok: false, error: chrome.runtime.lastError.message });
      return;
    }

    const tasks = Array.isArray(result.tasks) ? result.tasks : [];
    const task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      url: message.url || sender.tab?.url || "",
      sourceUrl: message.url || sender.tab?.url || "",
      createdAt: new Date().toISOString(),
    };

    chrome.storage.local.set({ tasks: [task, ...tasks] }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ ok: true });
    });
  });

  return true;
});
