import {
  createStore,
  defaults,
  effective,
  fontsKey,
  type KeyValue,
  newSite,
  readFonts,
  readSite,
  siteKey,
  variables,
} from "@cossplay/core/coss"
import { setHost, usePanelStore } from "@cossplay/editor/store"

// Editor 在自己的 origin 下，用 localStorage 存一份主题。
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

// 只注入当前模式的 override，和扩展一样：没动过的 token 仍用 coss ui 自己的值，
// 而且 editor.css 里 `:root:root` 压过 `:root` 和 `.dark`。
const rule = ({ site, detection, mode }: PanelState) => {
  if (!site || !detection) return null
  const { overrides } = site.current
  const theme = effective(detection.theme, overrides)
  return css(":root:root", variables(theme[mode], overrides[mode]))
}

/** 自定义预览收到的样式表：主题的 Google 字体和变量。 */
export async function previewCss(state: PanelState) {
  const fonts = readFonts(await kv.getItem(fontsKey(location.origin)))
  return [...Object.values(fonts), rule(state) ?? ""].join("\n")
}

/** 加载已存主题并应用到本文档；返回清理函数。 */
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
    const text = rule(state)
    if (text !== null) style.textContent = text
  }
  const unsubscribe = usePanelStore.subscribe(apply)
  document.head.append(style)

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
          theme: defaults,
          sourceFormat: { light: {}, dark: {} },
          sources: [],
          mode: "light",
          warnings: [],
        },
        mode: site.previewMode ?? "light",
        status: "已保存在本地",
      })
    }
  )
  return () => {
    active = false
    unsubscribe()
    style.remove()
  }
}
