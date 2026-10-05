import { useMemo } from "react"
import { create } from "zustand"
import {
  LOCAL_THEMES,
  coalesces,
  createTarget,
  effective,
  importTheme,
  newSite,
  readLocalThemes,
  readSite,
  siteKey,
  toContent,
  toWorker,
  transition,
  validValue,
  type ContentResponse,
  type Detection,
  type Edit,
  type Hsl,
  type LastEdit,
  type LocalTheme,
  type Mode,
  type Overrides,
  type SiteState,
  type ThemeOp,
  type Token,
} from "theme-core/coss"

/**
 * Side panel state for the active tab, ported from Shadify's panel.
 *  - `site`: origin preferences (overrides, history, enabled, preview mode). Shared through
 *    chrome.storage and written only by the service worker.
 *  - `detection`: the target document's own theme. Never persisted.
 * Edits apply optimistically; the worker re-runs them on the latest stored state and its
 * result wins once no edit is pending, so concurrent panels never overwrite each other.
 */
interface SiteStore {
  site: SiteState | null
  detection: Detection | null
  mode: Mode
  status: string
  error: string
  locals: LocalTheme[]
}

export const useSiteStore = create<SiteStore>()(() => ({
  site: null,
  detection: null,
  mode: "light",
  status: "正在连接当前标签页…",
  error: "",
  locals: [],
}))

const set = useSiteStore.setState
const get = useSiteStore.getState
const target = createTarget()
let pending = 0
let lastEdit: LastEdit | null = null

export function useTheme() {
  const site = useSiteStore((s) => s.site)
  const detection = useSiteStore((s) => s.detection)
  return useMemo(
    () => (site && detection ? effective(detection.theme, site.current.overrides) : null),
    [site, detection]
  )
}

export const setError = (error: string) => set({ error })

async function resync(origin: string) {
  const stored = await chrome.storage.local.get(siteKey(origin))
  if (pending === 0 && get().site?.origin === origin)
    set({ site: readSite(stored[siteKey(origin)], origin) ?? newSite(origin) })
}

async function loadTab(id: number) {
  const lease = target.begin(id)
  try {
    const tab = await chrome.tabs.get(id)
    if (!lease.live()) return
    if (!tab.url?.startsWith("http")) {
      set({ status: "打开一个 HTTP(S) 网站来编辑它的主题。", site: null, detection: null })
      return
    }
    set({ status: "正在读取页面原始主题…", error: "" })
    // MV3's content script can finish loading after tabs.onUpdated reports complete.
    let response: ContentResponse["inspect"] | undefined
    for (let attempt = 0; attempt < 12; attempt++) {
      if (!lease.live()) return
      try {
        response = await toContent(id, { type: "inspect" })
        break
      } catch (error) {
        if (attempt === 11 || !String(error).includes("Receiving end does not exist")) throw error
        await new Promise((resolve) => setTimeout(resolve, 150))
      }
    }
    if (!lease.live() || !response) return
    const detection = response.detection
    const origin = new URL(tab.url).origin
    const stored = await chrome.storage.local.get(siteKey(origin))
    if (!lease.live()) return
    const site = readSite(stored[siteKey(origin)], origin) ?? newSite(origin)
    lastEdit = null
    set({
      site,
      detection,
      mode: site.previewMode ?? detection.mode,
      status: detection.detected ? "已检测到页面主题变量" : "未检测到 coss / shadcn 主题变量",
    })
  } catch (e) {
    if (lease.live())
      set({
        error: `${String(e)}。安装扩展后请刷新页面。`,
        status: "无法连接此页面",
        site: null,
        detection: null,
      })
  }
}

/** Follows the active tab of the panel's window and storage changes; returns a cleanup. */
export function connect() {
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    if (!tabs[0]) return
    target.setWindow(tabs[0].windowId)
    if (tabs[0].id) loadTab(tabs[0].id)
  })
  chrome.storage.local.get(LOCAL_THEMES).then((data) => set({ locals: readLocalThemes(data[LOCAL_THEMES]) }))
  const activated = (info: chrome.tabs.TabActiveInfo) => {
    if (target.owns(info.windowId)) loadTab(info.tabId)
  }
  const updated = (id: number, info: chrome.tabs.TabChangeInfo) => {
    if (info.status === "complete" && id === target.lease?.tabId) loadTab(id)
  }
  // Another panel (or window) may change the same origin or the theme list.
  const changed = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== "local") return
    if (changes[LOCAL_THEMES]) set({ locals: readLocalThemes(changes[LOCAL_THEMES].newValue) })
    const origin = get().site?.origin
    if (origin && changes[siteKey(origin)] && pending === 0)
      set({ site: readSite(changes[siteKey(origin)].newValue, origin) ?? newSite(origin) })
  }
  chrome.tabs.onActivated.addListener(activated)
  chrome.tabs.onUpdated.addListener(updated)
  chrome.storage.onChanged.addListener(changed)
  return () => {
    chrome.tabs.onActivated.removeListener(activated)
    chrome.tabs.onUpdated.removeListener(updated)
    chrome.storage.onChanged.removeListener(changed)
  }
}

/** `key` names a continuous control: its edits within 500ms form one undo step. */
export function dispatch(edit: Edit, key = "") {
  const current = get().site
  const baseline = get().detection?.theme
  if (!current || !baseline) return
  const now = Date.now()
  const next = transition(current, edit, baseline, coalesces(lastEdit, key, current, now))
  lastEdit = { key, at: now, current: JSON.stringify(next.current) }
  set({ site: next, status: "保存中…" })
  pending++
  toWorker({ type: "edit", origin: current.origin, edit, baseline, key }).then(
    ({ state }) => {
      if (--pending || get().site?.origin !== state.origin) return
      set({ site: state, status: "已保存到本地" })
    },
    (e) => {
      set({ error: `保存失败：${String(e)}`, status: "未保存" })
      if (--pending === 0) resync(current.origin).catch(console.error)
    }
  )
}

export function updateToken(token: Token, value: string) {
  const mode = get().mode
  if (validValue(token, value)) dispatch({ kind: "token", mode, token, value }, `${mode}:${token}`)
}
export const applyOverrides = (overrides: Overrides, themeId = "") =>
  dispatch({ kind: "theme", overrides, themeId })
export function preview(mode: Mode) {
  set({ mode })
  dispatch({ kind: "preview", mode })
}
export const adjust = (hsl: Hsl, continuous = false) =>
  dispatch({ kind: "hsl", hsl }, continuous ? "hsl" : "")
export const syncSidebar = () => dispatch({ kind: "sidebar", mode: get().mode })

/** Fetches a Google font stylesheet once per origin; the content script injects it while a font token uses it. */
export async function loadFont(family: string, weights: string[]) {
  const lease = target.lease
  const origin = get().site?.origin
  if (!lease || !origin) return
  try {
    const wght = ["400", "700"].filter((w) => weights.includes(w))
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}${wght.length ? `:wght@${wght.join(";")}` : ""}&display=swap`
    const { text: css } = await toWorker({ type: "fetch", url })
    await toWorker({ type: "font", origin, family, css })
    if (!lease.live()) return
    const sheet = document.createElement("style")
    sheet.textContent = css
    document.head.append(sheet)
    set({ status: `已加载 ${family}；网站 CSP 可能限制字体` })
  } catch (err) {
    if (lease.live()) set({ error: `字体加载失败：${String(err)}` })
  }
}

export function themeOp(op: ThemeOp) {
  toWorker({ type: "themes", op }).then(
    ({ themes }) => set({ locals: themes }),
    (e) => set({ error: `本地主题保存失败：${String(e)}` })
  )
}

/** Imports CSS / tweakcn or registry JSON text, or fetches it from a URL (tweakcn theme links included). */
export async function importFrom(text: string, rawUrl: string) {
  const lease = target.lease
  let input = text
  if (rawUrl.trim()) {
    const url = new URL(rawUrl.trim())
    if ((url.hostname === "tweakcn.com" || url.hostname === "www.tweakcn.com") && !url.pathname.endsWith(".json")) {
      const id = url.searchParams.get("theme") ?? url.pathname.split("/").filter(Boolean).at(-1)
      if (!id || id === "editor") throw Error("请使用 tweakcn 主题 registry URL 或带 ID 的主题链接")
      url.pathname = `/r/themes/${encodeURIComponent(id)}.json`
      url.search = ""
    }
    input = (await toWorker({ type: "fetch", url: url.href })).text
  }
  if (!lease?.live()) throw Error("目标标签页已切换，请在要编辑的网站上重试导入")
  applyOverrides(importTheme(input))
  set({ error: "" })
}
