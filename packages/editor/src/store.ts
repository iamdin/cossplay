import {
  coalesces,
  type Detection,
  type Edit,
  effective,
  type Hsl,
  type LastEdit,
  type Mode,
  type Overrides,
  type SiteState,
  type Token,
  transition,
  validValue,
} from "@cossplay/core/coss"
import { importTheme } from "@cossplay/core/coss/import"
import { useMemo } from "react"
import { create } from "zustand"
import fonts from "./fonts.json"

/** Where the panel runs: the extension (a live site) or the web editor. */
export type Host = {
  /** Applies one edit to the stored state and returns it; the stored result wins. */
  edit(
    origin: string,
    edit: Edit,
    baseline: Detection["theme"],
    key: string
  ): Promise<SiteState>
  /** The stored state, to recover after a failed save. */
  load(origin: string): Promise<SiteState>
  font(origin: string, family: string, css: string): Promise<void>
  fetchText(url: string): Promise<string>
}

/**
 * Panel state.
 *  - `site`: preferences for the edited origin (overrides, history, enabled, preview mode).
 *  - `detection`: the edited document's own theme. Never persisted.
 * Edits apply optimistically; the host's result wins once no edit is pending.
 */
interface PanelStore {
  site: SiteState | null
  detection: Detection | null
  mode: Mode
  status: string
  error: string
}

export const usePanelStore = create<PanelStore>()(() => ({
  site: null,
  detection: null,
  mode: "light",
  status: "",
  error: "",
}))

const set = usePanelStore.setState
const get = usePanelStore.getState
let host: Host | null = null
let pending = 0
let lastEdit: LastEdit | null = null

export const setHost = (h: Host) => {
  host = h
}
/** Host state from storage must not overwrite optimistic edits still in flight. */
export const editsPending = () => pending > 0

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
  const site = usePanelStore((s) => s.site)
  const detection = usePanelStore((s) => s.detection)
  return useMemo(
    () =>
      site && detection
        ? effective(detection.theme, site.current.overrides)
        : null,
    [site, detection]
  )
}

export const setError = (error: string) => set({ error })

/** `key` names a continuous control: its edits within 500ms form one undo step. */
export function dispatch(edit: Edit, key = "") {
  const current = get().site
  const baseline = get().detection?.theme
  if (!host || !current || !baseline) return
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
  host.edit(current.origin, edit, baseline, key).then(
    (state) => {
      if (--pending || get().site?.origin !== state.origin) return
      set({ site: state, status: "Saved locally" })
    },
    (e) => {
      set({ error: `Could not save: ${String(e)}`, status: "Not saved" })
      if (--pending === 0)
        host?.load(current.origin).then((site) => {
          if (pending === 0 && get().site?.origin === site.origin) set({ site })
        }, console.error)
    }
  )
}

export function updateToken(token: Token, value: string) {
  const mode = get().mode
  if (validValue(token, value))
    dispatch({ kind: "token", mode, token, value }, `${mode}:${token}`)
}
/** Applies a whole theme (preset or import) and loads its Google fonts. */
export function applyOverrides(overrides: Overrides, themeId = "") {
  dispatch({ kind: "theme", overrides, themeId })
  const families = new Set(
    [overrides.light, overrides.dark].flatMap((values) =>
      fontTokens.flatMap((token) => {
        const value = values[token]
        return value ? [familyOf(value)] : []
      })
    )
  )
  for (const family of families) fetchFont(family)
}
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

/** Loads a Google font the user picked, also when the page already declares it. */
export async function loadFont(family: string) {
  const theme = currentTheme()
  if (!theme) return
  // A font the page already declares must become an override for the host to load it.
  const mode = get().mode
  for (const token of fontTokens)
    if (familyOf(theme[mode][token]).toLowerCase() === family.toLowerCase())
      updateToken(token, theme[mode][token])
  await fetchFont(family)
}

const fetched = new Set<string>()
/** Fetches a Google font stylesheet once per origin, stores it for the host and loads it here. */
async function fetchFont(family: string) {
  const origin = get().site?.origin
  const metadata = fonts.find(
    (f) => f.family.toLowerCase() === family.toLowerCase()
  )
  if (!host || !origin || !metadata) return
  const key = `${origin} ${metadata.family}`
  if (fetched.has(key)) return
  fetched.add(key)
  try {
    const wght = ["400", "700"].filter((w) => metadata.weights.includes(w))
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(metadata.family)}${wght.length ? `:wght@${wght.join(";")}` : ""}&display=swap`
    const css = await host.fetchText(url)
    await host.font(origin, metadata.family, css)
    // The panel moved to another origin; load it here again when it comes back.
    if (get().site?.origin !== origin) return void fetched.delete(key)
    const sheet = document.createElement("style")
    sheet.textContent = css
    document.head.append(sheet)
    set({ status: `Loaded ${metadata.family}` })
  } catch (err) {
    fetched.delete(key)
    if (get().site?.origin === origin)
      set({ error: `Font loading failed: ${String(err)}` })
  }
}

/** Imports CSS / tweakcn or registry JSON text, or fetches it from a URL (tweakcn theme links included). */
export async function importFrom(text: string, rawUrl: string) {
  const origin = get().site?.origin
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
    if (!host) throw Error("Not connected")
    input = await host.fetchText(url.href)
  }
  if (!origin || get().site?.origin !== origin)
    throw Error("Target changed; retry the import")
  applyOverrides(importTheme(input))
  set({ error: "" })
}
