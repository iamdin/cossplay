// coss ui 的主题变量（packages/ui/src/styles/globals.css）加上 tweakcn 的共用字段，做法同
// Shadify。coss 的值来自 scripts/sync-coss-defaults.ts；tweakcn 的默认、预设和 HSL
// 预设来自冻结的 tweakcn 修订（scripts/sync-tweakcn.mjs）。页面检测到的值优先于两者。

import { converter } from "culori"
import {
  adjustColor,
  type ColorFormat,
  formatColor,
  parseColor,
  sourceFormat,
} from "./colors"
import coss from "./defaults.json"
import reference from "./tweakcn.json"

export type Mode = "light" | "dark"
export const commonTokens = [
  "font-sans",
  "font-serif",
  "font-mono",
  "radius",
  "shadow-opacity",
  "shadow-blur",
  "shadow-spread",
  "shadow-offset-x",
  "shadow-offset-y",
  "letter-spacing",
  "spacing",
] as const
export type CommonToken = (typeof commonTokens)[number]
export type ColorToken =
  | Exclude<keyof typeof coss.light, "radius" | "font-sans" | "font-mono">
  | "shadow-color"
export type Token = ColorToken | CommonToken
export type Theme = Record<Mode, Record<Token, string>>
export type Overrides = Record<Mode, Partial<Record<Token, string>>>
export const colorTokens = [...coss.colors, "shadow-color"] as ColorToken[]
export const tokens = [...colorTokens, ...commonTokens] as Token[]
const tweakcnDefaults = (mode: Mode) =>
  Object.fromEntries(
    [...commonTokens, "shadow-color"].map((k) => [
      k,
      reference.defaults[mode][k as keyof typeof reference.defaults.light],
    ])
  )
export const defaults = {
  light: { ...tweakcnDefaults("light"), ...coss.light },
  dark: { ...tweakcnDefaults("dark"), ...coss.dark },
} as Theme
export const isCommon = (token: Token) =>
  (commonTokens as readonly string[]).includes(token)
export const isColor = (token: Token) =>
  (colorTokens as string[]).includes(token)
export const emptyOverrides = (): Overrides => ({ light: {}, dark: {} })
export const clone = <T>(value: T): T => structuredClone(value)
export const sidebarSync: Partial<Record<Token, Token>> = {
  sidebar: "background",
  "sidebar-foreground": "foreground",
  "sidebar-primary": "primary",
  "sidebar-primary-foreground": "primary-foreground",
  "sidebar-accent": "accent",
  "sidebar-accent-foreground": "accent-foreground",
  "sidebar-border": "border",
  "sidebar-ring": "ring",
}
export const groups: Record<string, ColorToken[]> = {
  Primary: ["primary", "primary-foreground"],
  Secondary: ["secondary", "secondary-foreground"],
  Accent: ["accent", "accent-foreground"],
  Base: ["background", "foreground"],
  Card: ["card", "card-foreground"],
  Popover: ["popover", "popover-foreground"],
  Muted: ["muted", "muted-foreground"],
  Destructive: ["destructive", "destructive-foreground"],
  Info: ["info", "info-foreground"],
  Success: ["success", "success-foreground"],
  Warning: ["warning", "warning-foreground"],
  "Border & Input": ["border", "input", "ring"],
  Charts: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
  Sidebar: [
    "sidebar",
    "sidebar-foreground",
    "sidebar-primary",
    "sidebar-primary-foreground",
    "sidebar-accent",
    "sidebar-accent-foreground",
    "sidebar-border",
    "sidebar-ring",
  ],
  Code: ["code", "code-foreground", "code-highlight"],
}
// coss 把语义前景画成页面上的文字（徽章、提示），不是画在纯色上。
export const contrastPairs: {
  label: string
  foreground: Token
  background: Token
}[] = [
  ["Base", "foreground", "background"],
  ["Card", "card-foreground", "card"],
  ["Popover", "popover-foreground", "popover"],
  ["Primary", "primary-foreground", "primary"],
  ["Secondary", "secondary-foreground", "secondary"],
  ["Muted", "muted-foreground", "muted"],
  ["Accent", "accent-foreground", "accent"],
  ["Destructive", "destructive-foreground", "background"],
  ["Info", "info-foreground", "background"],
  ["Success", "success-foreground", "background"],
  ["Warning", "warning-foreground", "background"],
  ["Sidebar", "sidebar-foreground", "sidebar"],
  ["Sidebar Primary", "sidebar-primary-foreground", "sidebar-primary"],
  ["Sidebar Accent", "sidebar-accent-foreground", "sidebar-accent"],
  ["Code", "code-foreground", "code"],
].map(([label, foreground, background]) => ({
  label,
  foreground: foreground as Token,
  background: background as Token,
}))
export const numericControls: Partial<
  Record<Token, { min: number; max: number; step: number; unit: string }>
> = {
  radius: { min: 0, max: 5, step: 0.025, unit: "rem" },
  spacing: { min: 0.15, max: 0.35, step: 0.01, unit: "rem" },
  "letter-spacing": { min: -0.5, max: 0.5, step: 0.025, unit: "em" },
  "shadow-opacity": { min: 0, max: 1, step: 0.01, unit: "" },
  "shadow-blur": { min: 0, max: 50, step: 0.5, unit: "px" },
  "shadow-spread": { min: -50, max: 50, step: 0.5, unit: "px" },
  "shadow-offset-x": { min: -50, max: 50, step: 0.5, unit: "px" },
  "shadow-offset-y": { min: -50, max: 50, step: 0.5, unit: "px" },
}
export const hslPresets = reference.hslPresets
export function validValue(key: Token, value: string) {
  if (
    !value.trim() ||
    value.length > 500 ||
    /[;{}<>\n\r]|url\s*\(|@import|!important/i.test(value)
  )
    return false
  if (isColor(key)) return !!parseColor(value)
  if (key.startsWith("font-"))
    return value
      .split(",")
      .every((family) =>
        /^(?:"[\p{L}\p{N}\s_.-]+"|'[\p{L}\p{N}\s_.-]+'|[\p{L}_-][\p{L}\p{N}\s_-]*)$/u.test(
          family.trim()
        )
      )
  if (key === "letter-spacing" && value === "normal") return true
  const n = Number.parseFloat(value)
  const length =
    /^[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[-+]?\d+)?(px|rem|em|%)?$/i.exec(
      value.trim()
    )
  if (!Number.isFinite(n) || !length) return false
  if (key === "shadow-opacity") return n >= 0 && n <= 1 && !length[1]
  if (n !== 0 && !length[1]) return false
  if (
    length[1] === "%" &&
    (key.startsWith("shadow-") || key === "letter-spacing")
  )
    return false
  return !["radius", "spacing", "shadow-blur"].includes(key) || n >= 0
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("需要一个主题对象")
  return value as Record<string, unknown>
}
const tokenName = (raw: string) =>
  raw
    .replace(/^--/, "")
    .replace(/^color-/, "")
    .replace(/^tracking-normal$/, "letter-spacing")
    .replace(/^shadow-x$/, "shadow-offset-x")
    .replace(/^shadow-y$/, "shadow-offset-y") as Token
// 只保留有具体值的已知 token。var()、color-mix() 和 --alpha() 的来源会跳过：
// 它们只在原来的样式表里才有意义。
function readTokens(value: unknown): Partial<Record<Token, string>> {
  const result: Partial<Record<Token, string>> = {}
  for (const [raw, v] of Object.entries(record(value))) {
    const key = tokenName(raw)
    if (
      tokens.includes(key) &&
      typeof v === "string" &&
      validValue(key, v.trim())
    )
      result[key] = v.trim()
  }
  return result
}
// 导入的主题和预设只覆盖它们定义的部分；其余仍是页面自己的。
// 只声明一次的共用 token 两种模式都生效。
export function importOverrides(value: unknown): Overrides {
  const data = record(value)
  const source = record(data.styles ?? data.cssVars ?? data)
  const shared = readTokens(source.theme ?? {})
  const light = readTokens(source.light ?? {}),
    dark = readTokens(source.dark ?? {})
  if (
    !Object.keys(light).length &&
    !Object.keys(dark).length &&
    !Object.keys(shared).length
  )
    throw Error("没有识别到 coss 主题令牌")
  const common = Object.fromEntries(
    Object.entries({ ...shared, ...light }).filter(([key]) =>
      isCommon(key as Token)
    )
  )
  const result = {
    light: { ...shared, ...light },
    dark: { ...common, ...dark },
  }
  return "info" in result.light || "info" in result.dark
    ? result
    : {
        light: fromShadcn(result.light, "light"),
        dark: fromShadcn(result.dark, "dark"),
      }
}
// shadcn/tweakcn 主题没有 coss 专有 token，它们的 destructive-foreground 是纯色上的文字。
// coss 把 destructive-foreground 用作页面上的彩色文字（destructive 色相，明度用 coss 自己的正文明度），
// 代码块则从表面色推导。
function fromShadcn(t: Partial<Record<Token, string>>, mode: Mode) {
  const r = { ...t }
  delete r["destructive-foreground"]
  if (t.destructive) {
    const oklch = converter("oklch")
    const { l } = oklch(parseColor(defaults[mode]["destructive-foreground"]))!
    const { c, h } = oklch(parseColor(t.destructive))!
    r["destructive-foreground"] = formatColor(
      `oklch(${l} ${c} ${h ?? 0})`,
      "oklch"
    )
  }
  if (t.card) r.code = t.card
  if (t["card-foreground"]) r["code-foreground"] = t["card-foreground"]
  if (t.muted) r["code-highlight"] = t.muted
  return r
}
export const presets = reference.presets as Record<
  string,
  { label: string; styles: Record<Mode, Record<string, string>> }
>
// "default" 是 coss 自己的主题；预设 id 是 tweakcn 的。
export function presetOverrides(id: string): Overrides {
  if (id === "default") return clone(defaults)
  if (!Object.hasOwn(presets, id)) throw Error("未知预设")
  return importOverrides(presets[id])
}
export function adjustTheme(
  base: Theme,
  hue: number,
  saturation: number,
  lightness: number
): Theme {
  const theme = clone(base)
  // HSL 往返会被夹到 sRGB；中性调整必须保持宽色域 oklch 颜色不变。
  if (hue === 0 && saturation === 1 && lightness === 1) return theme
  for (const mode of ["light", "dark"] as const)
    for (const key of colorTokens)
      theme[mode][key] = adjustColor(
        base[mode][key],
        hue,
        saturation,
        lightness
      )
  return theme
}
// tweakcn 的阴影比例：一层来自阴影控件，sm 及以上再加第二层。
export function shadows(styles: Record<Token, string>): Record<string, string> {
  const x = styles["shadow-offset-x"],
    y = styles["shadow-offset-y"],
    blur = styles["shadow-blur"],
    spread = styles["shadow-spread"]
  const opacity = Number(styles["shadow-opacity"])
  const color = (scale: number) =>
    formatColor(styles["shadow-color"], "hsl").replace(
      /(?:\s*\/[^)]*)?\)$/,
      ` / ${Math.min(1, opacity * scale).toFixed(2)})`
    )
  const first = (scale: number) => `${x} ${y} ${blur} ${spread} ${color(scale)}`
  const second = (sy: string, sb: string) =>
    `${x} ${sy} ${sb} calc(${Number(spread) === 0 ? "0px" : spread} - 1px) ${color(1)}`
  return {
    "shadow-2xs": first(0.5),
    "shadow-xs": first(0.5),
    "shadow-sm": `${first(1)}, ${second("1px", "2px")}`,
    shadow: `${first(1)}, ${second("1px", "2px")}`,
    "shadow-md": `${first(1)}, ${second("2px", "4px")}`,
    "shadow-lg": `${first(1)}, ${second("4px", "6px")}`,
    "shadow-xl": `${first(1)}, ${second("8px", "10px")}`,
    "shadow-2xl": first(2.5),
  }
}
// 被覆盖 token 的 CSS 变量，颜色按页面自己的格式写回。
export function variables(
  styles: Record<Token, string>,
  overrides: Partial<Record<Token, string>>,
  formats: Partial<Record<Token, ColorFormat>> = {}
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key of tokens)
    if (key in overrides) {
      const unit = numericControls[key]?.unit
      result[key] = isColor(key)
        ? formatColor(
            styles[key],
            formats[key] ?? sourceFormat(defaults.light[key])
          )
        : unit && Number(styles[key]) === 0
          ? `0${unit}`
          : styles[key]
    }
  // coss 组件给卡片、对话框和弹出层用 Tailwind 固定的 `--radius-2xl: 1rem`。
  // 推导方式和 coss 推导 sm/md/lg/xl 一样（固定偏移）：coss 默认 0.625rem 时是 1rem。
  if ("radius" in overrides) result["radius-2xl"] = "calc(var(--radius) + 6px)"
  if ("letter-spacing" in overrides) {
    result["tracking-normal"] = result["letter-spacing"]
    const base =
      styles["letter-spacing"] === "normal" ? "0em" : "var(--tracking-normal)"
    for (const [key, delta] of Object.entries({
      tighter: -0.05,
      tight: -0.025,
      wide: 0.025,
      wider: 0.05,
      widest: 0.1,
    }))
      result[`tracking-${key}`] = `calc(${base} + ${delta}em)`
  }
  if (Object.keys(overrides).some((k) => k.startsWith("shadow-")))
    Object.assign(result, shadows(styles), {
      "shadow-x": styles["shadow-offset-x"],
      "shadow-y": styles["shadow-offset-y"],
    })
  return result
}
// 形状与 coss ui 的 globals.css 相同，可以替换该文件的主题段。
export function themeCss(theme: Theme, format: ColorFormat): string {
  const block = (
    selector: string,
    keys: Token[],
    values: Record<Token, string>
  ) => {
    const formats = Object.fromEntries(colorTokens.map((key) => [key, format]))
    return `${selector} {\n${Object.entries(
      variables(values, Object.fromEntries(keys.map((k) => [k, ""])), formats)
    )
      .map(([key, value]) => `  --${key}: ${value};`)
      .join("\n")}\n}`
  }
  return `${block(":root", tokens, theme.light)}\n\n${block(".dark", colorTokens, theme.dark)}`
}
export function exportCss(theme: Theme, version: "3" | "4") {
  const css = themeCss(theme, version === "3" ? "triplet" : "oklch")
  const base = `  * {\n    @apply border-border${version === "4" ? " outline-ring/50" : ""};\n  }\n  body {\n    letter-spacing: var(--tracking-normal);\n  }`
  if (version === "3")
    return `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer base {\n${css}\n}\n\n@layer base {\n${base}\n}\n`
  const bindings = [
    "  --font-sans: var(--font-sans);",
    "  --font-heading: var(--font-sans);",
    "  --font-serif: var(--font-serif);",
    "  --font-mono: var(--font-mono);",
    ...colorTokens
      .filter((key) => key !== "shadow-color")
      .map((key) => `  --color-${key}: var(--${key});`),
    "  --radius-sm: calc(var(--radius) - 4px);",
    "  --radius-md: calc(var(--radius) - 2px);",
    "  --radius-lg: var(--radius);",
    "  --radius-xl: calc(var(--radius) + 4px);",
    "  --radius-2xl: calc(var(--radius) + 6px);",
    ...Object.keys(shadows(theme.light)).map(
      (key) => `  --${key}: var(--${key});`
    ),
  ]
  return `@import "tailwindcss";\n\n@custom-variant dark (&:is(.dark *));\n\n@theme inline {\n${bindings.join("\n")}\n}\n\n${css}\n\n@layer base {\n${base}\n}\n`
}
export function registryTheme(theme: Theme, name = "coss-theme") {
  const vars = (mode: Mode) => ({
    ...Object.fromEntries(
      colorTokens.map((key) => [key, formatColor(theme[mode][key], "oklch")])
    ),
    ...shadows(theme[mode]),
    "tracking-normal": theme[mode]["letter-spacing"],
  })
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: "registry:style",
    css: {
      "@layer base": { body: { "letter-spacing": "var(--tracking-normal)" } },
    },
    cssVars: {
      theme: Object.fromEntries(commonTokens.map((k) => [k, theme.light[k]])),
      light: vars("light"),
      dark: vars("dark"),
    },
  }
}
export function exportConfig() {
  const colors = Object.fromEntries(
    colorTokens
      .filter((k) => k !== "shadow-color")
      .map((k) => [k, `hsl(var(--${k}))`])
  )
  return `export default ${JSON.stringify(
    {
      darkMode: ["class"],
      theme: {
        extend: {
          colors,
          borderRadius: {
            "2xl": "calc(var(--radius) + 6px)",
            xl: "calc(var(--radius) + 4px)",
            lg: "var(--radius)",
            md: "calc(var(--radius) - 2px)",
            sm: "calc(var(--radius) - 4px)",
          },
          fontFamily: {
            sans: ["var(--font-sans)"],
            serif: ["var(--font-serif)"],
            mono: ["var(--font-mono)"],
          },
          boxShadow: Object.fromEntries(
            Object.keys(shadows(defaults.light)).map((k) => [
              k.replace(/^shadow-?/, "") || "DEFAULT",
              `var(--${k})`,
            ])
          ),
        },
      },
    },
    null,
    2
  )};\n`
}
export function exportLayout(
  theme: Theme,
  fonts: { family: string; weights: string[] }[]
) {
  const slots = (["sans", "serif", "mono"] as const).flatMap((slot) => {
    const family = theme.light[`font-${slot}`]
      .split(",")[0]
      .replaceAll(/['"]/g, "")
      .trim()
    const font = fonts.find((f) => f.family === family)
    return font
      ? [
          {
            slot,
            font,
            name: family.replace(/\W+/g, "_").replace(/^(?=\d)/, "_"),
          },
        ]
      : []
  })
  const imports = [...new Set(slots.map((s) => s.name))].join(", ")
  const definitions = slots
    .map(
      (s) =>
        `const font${s.slot[0].toUpperCase()}${s.slot.slice(1)} = ${s.name}({ subsets: ["latin"], weight: "${s.font.weights.includes("400") ? "400" : s.font.weights[0]}", variable: "--font-${s.slot}" });`
    )
    .join("\n")
  const classes = slots
    .map((s) => `\${font${s.slot[0].toUpperCase()}${s.slot.slice(1)}.variable}`)
    .join(" ")
  return `import type { ReactNode } from "react";\n${imports ? `import { ${imports} } from "next/font/google";\n` : ""}import "./globals.css";\n\n${definitions}\n\nexport default function RootLayout({ children }: { children: ReactNode }) {\n  return (\n    <html lang="en">\n      <body className={\`${classes} relative font-sans\`}>\n        <div className="isolate relative flex min-h-svh flex-col">{children}</div>\n      </body>\n    </html>\n  );\n}\n`
}
// 站点的静态 shadcn 注册表：每个预设一项（套在 coss ui 默认值上），外加索引。
// 网页构建把它们写到 /r/themes/<name>.json。
export const registryUrl = "https://cossplay.vercel.app/r/themes"
export function presetRegistry() {
  const items = ["default", ...Object.keys(presets)].map((id) => {
    const overrides = presetOverrides(id)
    const title = id === "default" ? "coss 默认" : presets[id].label
    return {
      ...registryTheme(
        {
          light: { ...defaults.light, ...overrides.light },
          dark: { ...defaults.dark, ...overrides.dark },
        },
        id
      ),
      title,
      description: `${title}：适用于 coss ui 的主题，来自 Cossplay。`,
    }
  })
  return {
    items,
    index: {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "cossplay",
      homepage: "https://cossplay.vercel.app",
      items: items.map(({ name, type, title, description }) => ({
        name,
        type,
        title,
        description,
      })),
    },
  }
}
