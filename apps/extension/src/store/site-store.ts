import {
  content,
  type Detection,
  type InspectorPick,
  inspectorPort,
  newSite,
  readSite,
  siteKey,
  worker,
} from "@cossplay/core/coss"
import { focusControl } from "@cossplay/editor/inspect"
import { editsPending, setHost, usePanelStore } from "@cossplay/editor/store"
import { storage } from "@wxt-dev/storage"

/**
 * 把面板接到当前标签。站点状态经扩展存储共享，只有 service worker 会写；
 * `detection` 是该标签文档自己的主题。
 */
const set = usePanelStore.setState
const get = usePanelStore.getState
// 面板编辑自己窗口里的当前标签。每次加载标签都会中止上一次，异步工作在可见更新前先看信号。
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
  font: (origin, family, css) =>
    worker.sendMessage("font", { origin, family, css }),
  fetchText: async (url) => (await worker.sendMessage("fetch", { url })).text,
})

let inspector: chrome.runtime.Port | null = null

/** 端口连着时，标签上的检查模式跟着面板的开关。 */
function inspect(on: boolean) {
  inspector?.disconnect()
  inspector = null
  if (!on || tabId === null) return
  const port = chrome.tabs.connect(tabId, { name: inspectorPort })
  port.onMessage.addListener(({ token }: InspectorPick) => focusControl(token))
  // 标签结束了检查（Escape）、标签没了，或没有 content script 可连。
  port.onDisconnect.addListener(() => {
    const error = chrome.runtime.lastError?.message
    if (inspector !== port) return
    set({ inspecting: false })
    if (error) set({ error: `这里无法检查，请刷新页面。（${error}）` })
  })
  inspector = port
}

async function loadTab(id: number) {
  set({ inspecting: false })
  loading?.abort()
  loading = new AbortController()
  const { signal } = loading
  tabId = id
  try {
    const tab = await chrome.tabs.get(id)
    if (signal.aborted) return
    if (!tab.url?.startsWith("http")) {
      set({
        status: "请打开一个 HTTP(S) 网站来编辑它的主题。",
        site: null,
        detection: null,
      })
      return
    }
    set({ status: "正在读取原始主题…", error: "" })
    // MV3 的 content script 可能在 tabs.onUpdated 报 complete 之后才加载完。
    let response: { detection: Detection } | undefined
    for (let attempt = 0; attempt < 12; attempt++) {
      if (signal.aborted) return
      try {
        response = await content.sendMessage("inspect", undefined, id)
        break
      } catch (error) {
        // content script 加载完之前，tabs.sendMessage 得不到回应。
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
    // 另一个面板（或窗口）可能改同一个 origin。
    unwatchSite?.()
    unwatchSite = storage.watch(siteKey(origin), (value) => {
      if (!editsPending() && get().site?.origin === origin)
        set({ site: readSite(value, origin) ?? newSite(origin) })
    })
    set({
      site,
      detection,
      mode: site.previewMode ?? detection.mode,
      status: detection.detected ? "已检测到原始主题" : "未检测到 coss 变量",
    })
  } catch (e) {
    if (!signal.aborted)
      set({
        error: `${String(e)}。安装扩展后请刷新页面。`,
        status: "无法连接此页面",
        site: null,
        detection: null,
      })
  }
}

/** 跟随面板窗口的当前标签和存储变化；返回清理函数。 */
export function connect() {
  set({ status: "正在连接此标签页…" })
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    if (!tabs[0]) return
    windowId = tabs[0].windowId
    if (tabs[0].id) loadTab(tabs[0].id)
  })
  const activated = (info: chrome.tabs.TabActiveInfo) => {
    if (info.windowId === windowId) loadTab(info.tabId)
  }
  const updated = (id: number, info: chrome.tabs.TabChangeInfo) => {
    if (info.status === "complete" && id === tabId) loadTab(id)
  }
  const unsubscribe = usePanelStore.subscribe((state, previous) => {
    if (state.inspecting !== previous.inspecting) inspect(state.inspecting)
  })
  chrome.tabs.onActivated.addListener(activated)
  chrome.tabs.onUpdated.addListener(updated)
  return () => {
    chrome.tabs.onActivated.removeListener(activated)
    chrome.tabs.onUpdated.removeListener(updated)
    unwatchSite?.()
    loading?.abort()
    unsubscribe()
    inspect(false)
  }
}
