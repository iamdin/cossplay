import {
  content,
  type Detection,
  localThemesKey,
  newSite,
  readLocalThemes,
  readSite,
  siteKey,
  worker,
} from "@cossplay/core/coss"
import { editsPending, setHost, usePanelStore } from "@cossplay/editor/store"
import { storage } from "@wxt-dev/storage"

/**
 * Connects the panel to the active tab. Site state is shared through extension storage and
 * written only by the service worker; `detection` is the tab document's own theme.
 */
const set = usePanelStore.setState
const get = usePanelStore.getState
// The panel edits the active tab of its own window. Each tab load aborts the previous one,
// and async work checks its signal before any observable update.
let windowId: number | null = null
let tabId: number | null = null
let loading: AbortController | null = null
let unwatchSite: (() => void) | null = null

const stored = async (origin: string) =>
  readSite(await storage.getItem(siteKey(origin)), origin) ?? newSite(origin)

setHost({
  edit: async (origin, edit, baseline, key) =>
    (await worker.sendMessage("edit", { origin, edit, baseline, key })).state,
  load: stored,
  themes: async (op) => (await worker.sendMessage("themes", { op })).themes,
  font: (origin, family, css) =>
    worker.sendMessage("font", { origin, family, css }),
  fetchText: async (url) => (await worker.sendMessage("fetch", { url })).text,
})

async function loadTab(id: number) {
  loading?.abort()
  loading = new AbortController()
  const { signal } = loading
  tabId = id
  try {
    const tab = await chrome.tabs.get(id)
    if (signal.aborted) return
    if (!tab.url?.startsWith("http")) {
      set({
        status: "Open an HTTP(S) website to edit its theme.",
        site: null,
        detection: null,
      })
      return
    }
    set({ status: "Reading the original theme…", error: "" })
    // MV3's content script can finish loading after tabs.onUpdated reports complete.
    let response: { detection: Detection } | undefined
    for (let attempt = 0; attempt < 12; attempt++) {
      if (signal.aborted) return
      try {
        response = await content.sendMessage("inspect", undefined, id)
        break
      } catch (error) {
        // tabs.sendMessage gets no response until the content script has loaded.
        if (attempt === 11 || !String(error).includes("No response"))
          throw error
        await new Promise((resolve) => setTimeout(resolve, 150))
      }
    }
    if (signal.aborted || !response) return
    const detection = response.detection
    const origin = new URL(tab.url).origin
    const site = await stored(origin)
    if (signal.aborted) return
    // Another panel (or window) may change the same origin.
    unwatchSite?.()
    unwatchSite = storage.watch(siteKey(origin), (value) => {
      if (!editsPending() && get().site?.origin === origin)
        set({ site: readSite(value, origin) ?? newSite(origin) })
    })
    set({
      site,
      detection,
      mode: site.previewMode ?? detection.mode,
      status: detection.detected
        ? "Original theme detected"
        : "No coss variables detected",
    })
  } catch (e) {
    if (!signal.aborted)
      set({
        error: `${String(e)}. Reload the page after installing the extension.`,
        status: "Cannot connect to this page",
        site: null,
        detection: null,
      })
  }
}

/** Follows the active tab of the panel's window and storage changes; returns a cleanup. */
export function connect() {
  set({ status: "Connecting to this tab…" })
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    if (!tabs[0]) return
    windowId = tabs[0].windowId
    if (tabs[0].id) loadTab(tabs[0].id)
  })
  storage
    .getItem(localThemesKey)
    .then((value) => set({ locals: readLocalThemes(value) }))
  const unwatchThemes = storage.watch(localThemesKey, (value) =>
    set({ locals: readLocalThemes(value) })
  )
  const activated = (info: chrome.tabs.TabActiveInfo) => {
    if (info.windowId === windowId) loadTab(info.tabId)
  }
  const updated = (id: number, info: chrome.tabs.TabChangeInfo) => {
    if (info.status === "complete" && id === tabId) loadTab(id)
  }
  chrome.tabs.onActivated.addListener(activated)
  chrome.tabs.onUpdated.addListener(updated)
  return () => {
    chrome.tabs.onActivated.removeListener(activated)
    chrome.tabs.onUpdated.removeListener(updated)
    unwatchThemes()
    unwatchSite?.()
    loading?.abort()
  }
}
