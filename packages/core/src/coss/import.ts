import postcss from "postcss"
import { importOverrides, type Mode, type Overrides } from "./theme"

// 面板粘贴或拉取的主题 CSS / 注册表 JSON。不放进 barrel，这样 content script 和 worker 不会带上 postcss。
// 只读 :root、:host、.dark、[data-theme] 或 @theme 下的自定义属性。
export function parseCss(input: string): Overrides {
  const modes: Record<Mode, Record<string, string>> = { light: {}, dark: {} }
  postcss.parse(input).walkDecls(/^--/, (decl) => {
    const scopes: string[] = []
    for (
      let node = decl.parent;
      node && node.type !== "root";
      node = node.parent
    )
      scopes.push(
        node.type === "rule"
          ? (node as postcss.Rule).selector
          : node.type === "atrule"
            ? `@${(node as postcss.AtRule).name} ${(node as postcss.AtRule).params}`
            : ""
      )
    if (!scopes.some((s) => /:root|:host|\.dark|\[data-theme|@theme/.test(s)))
      return
    const mode = scopes.some((s) =>
      /\.dark\b|\[data-theme\s*=\s*["']?dark/.test(s)
    )
      ? "dark"
      : "light"
    modes[mode][decl.prop.slice(2)] = decl.value.trim()
  })
  return importOverrides(modes)
}
export function importTheme(input: string): Overrides {
  if (input.length > 2_000_000) throw Error("主题太大")
  if (input.trim().startsWith("{")) return importOverrides(JSON.parse(input))
  return parseCss(input)
}
