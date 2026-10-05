import postcss from "postcss"
import { importOverrides, type Mode, type Overrides } from "./theme"

// Theme CSS or registry JSON pasted or fetched by the panel. Kept out of the barrel so the
// content script and worker bundles do not include postcss.
// Only custom properties under :root, :host, .dark, [data-theme] or @theme are read.
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
  if (input.length > 2_000_000) throw Error("Theme is too large")
  if (input.trim().startsWith("{")) return importOverrides(JSON.parse(input))
  return parseCss(input)
}
