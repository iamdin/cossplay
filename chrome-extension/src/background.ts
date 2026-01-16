// Open side panel when clicking the extension icon
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id })
  }
})

// Set side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
