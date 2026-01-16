const STORAGE_KEY = "cossThemeVars"

const isTargetUrl = (url?: string) =>
  typeof url === "string" && (url === "https://coss.com/ui/docs" || url.startsWith("https://coss.com/ui/docs/"))

const sendToActiveTab = async (payload: unknown) => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const tab = tabs[0]
  if (!tab?.id || !isTargetUrl(tab.url)) {
    return
  }
  chrome.tabs.sendMessage(tab.id, payload)
}

// Open side panel when clicking the extension icon
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id })
  }
})

// Set side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "set-vars") {
    const vars = (message.vars ?? {}) as Record<string, string>
    chrome.storage.local.set({ [STORAGE_KEY]: vars }, () => {
      sendToActiveTab({ type: "apply-vars", vars })
      sendResponse({ ok: true })
    })
    return true
  }

  if (message?.type === "reset-vars") {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      chrome.storage.local.remove([STORAGE_KEY], () => {
        sendToActiveTab({ type: "reset-vars" })
        sendResponse({ ok: true, previous: result[STORAGE_KEY] })
      })
    })
    return true
  }

  if (message?.type === "reload-target") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.id || !isTargetUrl(tab.url)) {
        sendResponse({ ok: false, error: "未找到目标页面" })
        return
      }
      chrome.tabs.reload(tab.id, {}, () => {
        sendResponse({ ok: true })
      })
    })
    return true
  }

  if (message?.type === "get-vars") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.id || !isTargetUrl(tab.url)) {
        sendResponse({ ok: false, error: "未找到目标页面" })
        return
      }
      chrome.tabs.sendMessage(tab.id, { type: "get-vars", names: message.names }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message })
          return
        }
        sendResponse(response ?? { ok: false, error: "无返回数据" })
      })
    })
    return true
  }

  return false
})

chrome.tabs.onActivated.addListener(() => {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const vars = result[STORAGE_KEY] as Record<string, string> | undefined
    if (vars) {
      sendToActiveTab({ type: "apply-vars", vars })
    }
  })
})

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !isTargetUrl(tab.url)) {
    return
  }
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const vars = result[STORAGE_KEY] as Record<string, string> | undefined
    if (vars) {
      chrome.tabs.sendMessage(tab.id!, { type: "apply-vars", vars })
    }
  })
})
