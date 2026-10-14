// 把 coss 注册表样式（`npx shadcn init @coss/style` 装上的那份）解析成具体颜色，写入 src/coss/defaults.json。
// 用法：pnpm sync:defaults [coss 修订]

import fs from "node:fs/promises"
import module from "node:module"
import path from "node:path"
import { type Color, converter, interpolate, parse } from "culori"

const revision = process.argv[2] ?? "dd49ec9c2c268ae751724ddc64b343cb3a7e773b"
const source = `https://raw.githubusercontent.com/cosscom/coss/${revision}/apps/ui/public/r/style.json`
const { cssVars } = (await (await fetch(source)).json()) as {
  cssVars: Record<"light" | "dark", Record<string, string>>
}
const palette = await fs.readFile(
  module.createRequire(import.meta.url).resolve("tailwindcss/theme.css"),
  "utf8"
)

const vars: Record<string, string> = {}
for (const [, name, value] of palette.matchAll(/--(color-[\w-]+):\s*([^;]+);/g))
  vars[name] = value.trim()

const oklch = converter("oklch")
function resolve(value: string, scope: Record<string, string>): Color {
  const v = value.trim()
  let m = /^var\(--([\w-]+)\)$/.exec(v)
  if (m) return resolve(scope[m[1]] ?? vars[m[1]], scope)
  m = /^--alpha\((.+) \/ ([\d.]+)%\)$/.exec(v)
  if (m) return { ...resolve(m[1], scope), alpha: Number(m[2]) / 100 }
  m = /^color-mix\( ?in srgb, (.+) ([\d.]+)%, (.+?) ?\)$/.exec(v)
  if (m)
    return interpolate(
      [resolve(m[3], scope), resolve(m[1], scope)],
      "rgb"
    )(Number(m[2]) / 100)
  const color = parse(v)
  if (!color) throw Error(`Cannot resolve ${v}`)
  return color
}
const format = (color: Color) => {
  const c = oklch(color)
  const n = (x: number | undefined) => Number((x ?? 0).toFixed(4))
  return `oklch(${n(c.l)} ${n(c.c)} ${n(c.h)}${(c.alpha ?? 1) < 1 ? ` / ${n(c.alpha)}` : ""})`
}

const root = cssVars.light,
  dark = cssVars.dark
const fonts = {
  "font-sans":
    'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  "font-mono":
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
}
const colors = Object.keys(root).filter((name) => name !== "radius")
const mode = (scope: Record<string, string>) => ({
  ...Object.fromEntries(
    colors.map((name) => [name, format(resolve(scope[name], scope))])
  ),
  radius: root.radius,
  ...fonts,
})
const out = {
  source,
  colors,
  light: mode(root),
  dark: mode({ ...root, ...dark }),
}
await fs.writeFile(
  path.join(import.meta.dirname, "../src/coss/defaults.json"),
  `${JSON.stringify(out, null, 2)}\n`
)
console.log(`${colors.length} colors from ${source}`)
