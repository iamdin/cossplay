import {
  createStore,
  decodeThemeHash,
  effective,
  fontsKey,
  type KeyValue,
  newSite,
  readFonts,
  readSite,
  siteKey,
  variables,
} from "@cossplay/core/coss"
import { applyOverrides, setHost, usePanelStore } from "@cossplay/editor/store"
import { editorBaseline, installedStack } from "@/fonts"

// The editor keeps one theme, under its own origin, in localStorage.
const kv: KeyValue = {
  async getItem(key) {
    try {
      const value = localStorage.getItem(key)
      return value === null ? null : JSON.parse(value)
    } catch {
      return null
    }
  },
  async setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  },
}

const stored = async (origin: string) =>
  readSite(await kv.getItem(siteKey(origin)), origin) ?? newSite(origin)

const css = (selector: string, values: Record<string, string>) =>
  `${selector} {\n${Object.entries(values)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n")}\n}`

type PanelState = ReturnType<typeof usePanelStore.getState>

// Only the shown mode's overrides, like the extension: untouched tokens keep the
// page's own values, and `:root:root` outranks both `:root` and `.dark`.
// `resolveFaces` is for this document, which already loaded fontsource's Geist.
// A custom preview keeps the stored family names and its own font stylesheets.
const rule = ({ site, detection, mode }: PanelState, resolveFaces: boolean) => {
  if (!site || !detection) return null
  const { overrides } = site.current
  const theme = effective(detection.theme, overrides)
  const values = variables(theme[mode], overrides[mode])
  if (resolveFaces)
    for (const token of ["font-sans", "font-mono"] as const) {
      const value = values[token]
      if (value) values[token] = installedStack(value)
    }
  return css(":root:root", values)
}

/** The stylesheet a custom preview receives: the theme's Google fonts and its variables. */
export async function previewCss(state: PanelState) {
  const fonts = readFonts(await kv.getItem(fontsKey(location.origin)))
  return [...Object.values(fonts), rule(state, false) ?? ""].join("\n")
}

/** Loads the saved theme and applies it to this document; returns a cleanup. */
export function connect() {
  const origin = location.origin
  const store = createStore(kv)
  setHost({
    edit: store.edit,
    load: stored,
    font: store.font,
    async fetchText(url) {
      const response = await fetch(url)
      if (!response.ok)
        throw Error(`${response.status} ${response.statusText} from ${url}`)
      return response.text()
    },
  })

  const style = document.createElement("style")
  style.id = "cossplay-theme"
  const apply = (state: PanelState) => {
    document.documentElement.classList.toggle("dark", state.mode === "dark")
    const text = rule(state, true)
    if (text !== null) style.textContent = text
  }
  const unsubscribe = usePanelStore.subscribe(apply)
  document.head.append(style)

  const syncHash = () => {
    if (location.hash.includes("theme=")) {
      const decoded = decodeThemeHash(location.hash)
      if (decoded) {
        applyOverrides(decoded.overrides, decoded.themeId)
        usePanelStore.setState({ status: "Loaded shared theme" })
      }
    }
  }

  let active = true
  Promise.all([stored(origin), kv.getItem(fontsKey(origin))]).then(
    ([site, fonts]) => {
      if (!active) return
      for (const sheet of Object.values(readFonts(fonts))) {
        const font = document.createElement("style")
        font.textContent = sheet
        document.head.append(font)
      }
      usePanelStore.setState({
        site,
        detection: {
          detected: true,
          theme: editorBaseline(),
          sourceFormat: { light: {}, dark: {} },
          sources: [],
          mode: "light",
          warnings: [],
        },
        mode: site.previewMode ?? "light",
        status: "Saved locally",
      })
      syncHash()
    }
  )

  const onHashChange = () => syncHash()
  window.addEventListener("hashchange", onHashChange)

  return () => {
    active = false
    unsubscribe()
    window.removeEventListener("hashchange", onHashChange)
    style.remove()
  }
}
