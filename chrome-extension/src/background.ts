import { STORAGE_KEY_CSS, type PanelToBg } from "./shared/messages";

const isTargetUrl = (url?: string) =>
  typeof url === "string" &&
  (url === "https://coss.com/ui" || url.startsWith("https://coss.com/ui/"));

const sendToActiveTab = async (payload: unknown) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !isTargetUrl(tab.url)) return;
  chrome.tabs.sendMessage(tab.id, payload);
};

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) chrome.sidePanel.open({ tabId: tab.id });
});
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onMessage.addListener((message: PanelToBg, _sender, sendResponse) => {
  if (message?.type === "apply-css") {
    const { css } = message;
    chrome.storage.local.set({ [STORAGE_KEY_CSS]: css }, () => {
      sendToActiveTab({ type: "apply-css", css });
      sendResponse({ ok: true });
    });
    return true;
  }
  if (message?.type === "reset-vars") {
    chrome.storage.local.remove([STORAGE_KEY_CSS], () => {
      sendToActiveTab({ type: "reset-vars" });
      sendResponse({ ok: true });
    });
    return true;
  }
if (message?.type === "get-vars") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id || !isTargetUrl(tab.url)) {
        sendResponse({ ok: false, error: "未找到目标页面" });
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: "get-vars" }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse(response ?? { ok: false, error: "无返回数据" });
      });
    });
    return true;
  }
  return false;
});

const reapply = (tabId: number) => {
  chrome.storage.local.get([STORAGE_KEY_CSS], (result) => {
    const css = result[STORAGE_KEY_CSS] as string | undefined;
    if (css) chrome.tabs.sendMessage(tabId, { type: "apply-css", css });
  });
};

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    if (isTargetUrl(tab?.url)) reapply(tabId);
  });
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && isTargetUrl(tab.url)) reapply(tabId);
});
