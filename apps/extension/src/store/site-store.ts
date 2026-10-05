import {
  coalesces,
  content,
  type Detection,
  type Edit,
  effective,
  type Hsl,
  type LastEdit,
  type LocalTheme,
  localThemesKey,
  type Mode,
  newSite,
  type Overrides,
  readLocalThemes,
  readSite,
  type SiteState,
  siteKey,
  type ThemeOp,
  type Token,
  transition,
  validValue,
  worker,
} from "@coss-tweak/theme-core/coss"
import { importTheme } from "@coss-tweak/theme-core/coss/import"
import { storage } from "@wxt-dev/storage"
import { useMemo } from "react"
import { create } from "zustand"
import fonts from "@/data/fonts.json"

/**
 * Side panel state for the active tab.
 *  - `site`: origin preferences (overrides, history, enabled, preview mode). Shared through
 *    extension storage and written only by the service worker.
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
  status: "Connecting to this tab…",
  error: "",
  locals: [],
}))

const set = useSiteStore.setState
const get = useSiteStore.getState
// The panel edits the active tab of its own window. Each tab load aborts the previous one,
// and async work checks its signal before any observable update.
let windowId: number | null = null
let lease: { tabId: number; signal: AbortSignal } | null = null
let loading: AbortController | null = null
let unwatchSite: (() => void) | null = null
let pending = 0
let lastEdit: LastEdit | null = null

export const fontTokens = ["font-sans", "font-serif", "font-mono"] as const
export const familyOf = (stack: string) =>
  stack.split(",")[0].replaceAll(/['"]/g, "").trim()
const currentTheme = () => {
  const { site, detection } = get()
  return site && detection
    ? effective(detection.theme, site.current.overrides)
    : null
}

export function useTheme() {
  const site = useSiteStore((s) => s.site)
  const detection = useSiteStore((s) => s.detection)
  return useMemo(
    () =>
      site && detection
        ? effective(detection.theme, site.current.overrides)
        : null,
    [site, detection]
  )
}

export const setError = (error: string) => set({ error })

async function resync(origin: string) {
  const stored = await storage.getItem(siteKey(origin))
  if (pending === 0 && get().site?.origin === origin)
    set({ site: readSite(stored, origin) ?? newSite(origin) })
}

async function loadTab(id: number) {
  loading?.abort()
  loading = new AbortController()
  const { signal } = loading
  lease = { tabId: id, signal }
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
    const stored = await storage.getItem(siteKey(origin))
    if (signal.aborted) return
    const site = readSite(stored, origin) ?? newSite(origin)
    lastEdit = null
    // Another panel (or window) may change the same origin.
    unwatchSite?.()
    unwatchSite = storage.watch(siteKey(origin), (value) => {
      if (pending === 0 && get().site?.origin === origin)
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
    if (info.status === "complete" && id === lease?.tabId) loadTab(id)
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

/** `key` names a continuous control: its edits within 500ms form one undo step. */
export function dispatch(edit: Edit, key = "") {
  const current = get().site
  const baseline = get().detection?.theme
  if (!current || !baseline) return
  const now = Date.now()
  const next = transition(
    current,
    edit,
    baseline,
    coalesces(lastEdit, key, current, now)
  )
  lastEdit = { key, at: now, current: JSON.stringify(next.current) }
  set({ site: next, status: "Saving…" })
  pending++
  worker
    .sendMessage("edit", { origin: current.origin, edit, baseline, key })
    .then(
      ({ state }) => {
        if (--pending || get().site?.origin !== state.origin) return
        set({ site: state, status: "Saved locally" })
      },
      (e) => {
        set({ error: `Could not save: ${String(e)}`, status: "Not saved" })
        if (--pending === 0) resync(current.origin).catch(console.error)
      }
    )
}

export function updateToken(token: Token, value: string) {
  const mode = get().mode
  if (validValue(token, value))
    dispatch({ kind: "token", mode, token, value }, `${mode}:${token}`)
}
export const applyOverrides = (overrides: Overrides, themeId = "") =>
  dispatch({ kind: "theme", overrides, themeId })
export function reset() {
  const detection = get().detection
  if (detection) set({ mode: detection.mode })
  dispatch({ kind: "reset" })
}
export function preview(mode: Mode) {
  set({ mode })
  dispatch({ kind: "preview", mode })
}
export const adjust = (hsl: Hsl, continuous = false) =>
  dispatch({ kind: "hsl", hsl }, continuous ? "hsl" : "")
export const syncSidebar = () => dispatch({ kind: "sidebar", mode: get().mode })

/** Fetches a Google font stylesheet once per origin; the content script injects it while a font token uses it. */
export async function loadFont(family: string) {
  const signal = lease?.signal
  const origin = get().site?.origin
  const theme = currentTheme()
  const metadata = fonts.find((f) => f.family === family)
  if (!signal || !origin || !theme || !metadata) return
  // A font the page already declares must become an override for the content script to load it.
  const mode = get().mode
  for (const token of fontTokens)
    if (familyOf(theme[mode][token]).toLowerCase() === family.toLowerCase())
      updateToken(token, theme[mode][token])
  try {
    const wght = ["400", "700"].filter((w) => metadata.weights.includes(w))
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}${wght.length ? `:wght@${wght.join(";")}` : ""}&display=swap`
    const { text: css } = await worker.sendMessage("fetch", { url })
    await worker.sendMessage("font", { origin, family, css })
    if (signal.aborted) return
    const sheet = document.createElement("style")
    sheet.textContent = css
    document.head.append(sheet)
    set({ status: `Loaded ${family}; site CSP may restrict fonts` })
  } catch (err) {
    if (!signal.aborted) set({ error: `Font loading failed: ${String(err)}` })
  }
}

export function themeOp(op: ThemeOp) {
  worker.sendMessage("themes", { op }).then(
    ({ themes }) => set({ locals: themes }),
    (e) => set({ error: `Could not save local theme: ${String(e)}` })
  )
}

/** Imports CSS / tweakcn or registry JSON text, or fetches it from a URL (tweakcn theme links included). */
export async function importFrom(text: string, rawUrl: string) {
  const signal = lease?.signal
  let input = text
  if (rawUrl.trim()) {
    const url = new URL(rawUrl.trim())
    if (
      (url.hostname === "tweakcn.com" || url.hostname === "www.tweakcn.com") &&
      !url.pathname.endsWith(".json")
    ) {
      const id =
        url.searchParams.get("theme") ??
        url.pathname.split("/").filter(Boolean).at(-1)
      if (!id || id === "editor")
        throw Error(
          "Use a tweakcn theme registry URL or a theme link with an ID"
        )
      url.pathname = `/r/themes/${encodeURIComponent(id)}.json`
      url.search = ""
    }
    input = (await worker.sendMessage("fetch", { url: url.href })).text
  }
  if (!signal || signal.aborted)
    throw Error("Target tab changed; retry the import on the selected website")
  applyOverrides(importTheme(input))
  set({ error: "" })
}
