import {
  createStore,
  defaults,
  effective,
  fontsKey,
  type KeyValue,
  localThemesKey,
  newSite,
  readFonts,
  readLocalThemes,
  readSite,
  siteKey,
  variables,
} from "@cossplay/core/coss"
import { setHost, usePanelStore } from "@cossplay/editor/store"

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

/** Loads the saved theme and applies it to this document; returns a cleanup. */
export function connect() {
  const origin = location.origin
  const store = createStore(kv)
  setHost({
    edit: store.edit,
    load: stored,
    themes: store.themes,
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
  const apply = ({
    site,
    detection,
    mode,
  }: ReturnType<typeof usePanelStore.getState>) => {
    document.documentElement.classList.toggle("dark", mode === "dark")
    if (!site || !detection) return
    const { overrides } = site.current
    const theme = effective(detection.theme, overrides)
    // Only the shown mode's overrides, like the extension: untouched tokens keep coss ui's own
    // values, and `:root:root` outranks both `:root` and `.dark` in editor.css.
    style.textContent = css(
      ":root:root",
      variables(theme[mode], overrides[mode])
    )
  }
  const unsubscribe = usePanelStore.subscribe(apply)
  document.head.append(style)

  let active = true
  Promise.all([
    stored(origin),
    kv.getItem(localThemesKey),
    kv.getItem(fontsKey(origin)),
  ]).then(([site, locals, fonts]) => {
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
        theme: defaults,
        sourceFormat: { light: {}, dark: {} },
        sources: [],
        mode: "light",
        warnings: [],
      },
      mode: site.previewMode ?? "light",
      status: "Saved locally",
      locals: readLocalThemes(locals),
    })
  })
  return () => {
    active = false
    unsubscribe()
    style.remove()
  }
}
