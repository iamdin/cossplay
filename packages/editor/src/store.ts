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

/** 面板跑在哪里：扩展（真实站点）或网页 Editor。 */
export type Host = {
  /** 把一次编辑写进已存状态并返回；以存下来的结果为准。 */
  edit(
    origin: string,
    edit: Edit,
    baseline: Detection["theme"],
    key: string
  ): Promise<SiteState>
  /** 已存状态，保存失败时用来恢复。 */
  load(origin: string): Promise<SiteState>
  font(origin: string, family: string, css: string): Promise<void>
  fetchText(url: string): Promise<string>
}

/**
 * 面板状态。
 *  - `site`：正在编辑的 origin 的偏好（override、历史、开关、预览模式）。
 *  - `detection`：该文档自己的主题。不持久化。
 * 编辑先乐观生效；没有进行中的编辑时，以 Host 的结果为准。
 */
interface PanelStore {
  site: SiteState | null
  detection: Detection | null
  mode: Mode
  status: string
  error: string
  /** 检查模式：在预览或站点里点选元素，会聚焦对应 token 的控件。 */
  inspecting: boolean
  /** 颜色标签的筛选。 */
  search: string
}

export const usePanelStore = create<PanelStore>()(() => ({
  site: null,
  detection: null,
  mode: "light",
  status: "",
  error: "",
  inspecting: false,
  search: "",
}))

const set = usePanelStore.setState
const get = usePanelStore.getState
let host: Host | null = null
let pending = 0
let lastEdit: LastEdit | null = null

export const setHost = (h: Host) => {
  host = h
}
/** 存储里的 Host 状态不能盖掉还在飞的乐观编辑。 */
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

/** `key` 标出连续控件：500ms 内的编辑合成一步撤销。 */
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
  set({ site: next, status: "正在保存…" })
  pending++
  host.edit(current.origin, edit, baseline, key).then(
    (state) => {
      if (--pending || get().site?.origin !== state.origin) return
      set({ site: state, status: "已保存在本地" })
    },
    (e) => {
      set({ error: `未能保存：${String(e)}`, status: "未保存" })
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
/** 套用整套主题（预设或导入）并加载其中的 Google 字体。 */
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

/** 加载用户选中的 Google 字体，页面里已经声明过的也一样。 */
export async function loadFont(family: string) {
  const theme = currentTheme()
  if (!theme) return
  // 页面里已有的字体也要变成 override，Host 才会去加载。
  const mode = get().mode
  for (const token of fontTokens)
    if (familyOf(theme[mode][token]).toLowerCase() === family.toLowerCase())
      updateToken(token, theme[mode][token])
  await fetchFont(family)
}

const fetched = new Set<string>()
/** 每个 origin 只拉取一次 Google 字体样式表，交给 Host 保存，并在这里加载。 */
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
    // 面板已换到别的 origin；回来时再在这里加载。
    if (get().site?.origin !== origin) return void fetched.delete(key)
    const sheet = document.createElement("style")
    sheet.textContent = css
    document.head.append(sheet)
    set({ status: `已加载 ${metadata.family}` })
  } catch (err) {
    fetched.delete(key)
    if (get().site?.origin === origin)
      set({ error: `字体加载失败：${String(err)}` })
  }
}

/** 导入 CSS、tweakcn 或注册表 JSON，或从 URL 拉取（含 tweakcn 主题链接）。 */
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
        throw Error("请使用 tweakcn 主题注册表 URL，或带 ID 的主题链接")
      url.pathname = `/r/themes/${encodeURIComponent(id)}.json`
      url.search = ""
    }
    if (!host) throw Error("尚未连接")
    input = await host.fetchText(url.href)
  }
  if (!origin || get().site?.origin !== origin)
    throw Error("目标已变，请重新导入")
  applyOverrides(importTheme(input))
  set({ error: "" })
}
