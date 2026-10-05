// Resolves coss ui's globals.css (:root/.dark) into concrete colors and writes src/coss/defaults.json.
// Usage: bun scripts/sync-coss-defaults.ts [coss revision]
import fs from "node:fs/promises"
import path from "node:path"
import { converter, interpolate, parse, type Color } from "culori"

const revision = process.argv[2] ?? "bd3777acfb44921d4a90b43693a9e26b970b2ecb"
const source = `https://raw.githubusercontent.com/cosscom/coss/${revision}/packages/ui/src/styles/globals.css`
const css = await (await fetch(source)).text()
const palette = await fs.readFile(Bun.resolveSync("tailwindcss/theme.css", path.join(import.meta.dir, "../../../apps/side-panel")), "utf8")

const vars: Record<string, string> = {}
for (const [, name, value] of palette.matchAll(/--(color-[\w-]+):\s*([^;]+);/g)) vars[name] = value.trim()

function block(selector: string) {
  const match = new RegExp(`(?:^|\\n)${selector.replace(".", "\\.")} \\{([\\s\\S]*?)\\n\\}`).exec(css)
  if (!match) throw Error(`Missing ${selector} block`)
  const result: Record<string, string> = {}
  for (const [, name, value] of match[1].matchAll(/--([\w-]+):\s*([^;]+);/g)) result[name] = value.replace(/\s+/g, " ").trim()
  return result
}

const oklch = converter("oklch")
function resolve(value: string, scope: Record<string, string>): Color {
  const v = value.trim()
  let m = /^var\(--([\w-]+)\)$/.exec(v)
  if (m) return resolve(scope[m[1]] ?? vars[m[1]], scope)
  m = /^--alpha\((.+) \/ ([\d.]+)%\)$/.exec(v)
  if (m) return { ...resolve(m[1], scope), alpha: Number(m[2]) / 100 }
  m = /^color-mix\( ?in srgb, (.+) ([\d.]+)%, (.+?) ?\)$/.exec(v)
  if (m) return interpolate([resolve(m[3], scope), resolve(m[1], scope)], "rgb")(Number(m[2]) / 100)
  const color = parse(v)
  if (!color) throw Error(`Cannot resolve ${v}`)
  return color
}
const format = (color: Color) => {
  const c = oklch(color)
  const n = (x: number | undefined) => Number((x ?? 0).toFixed(4))
  return `oklch(${n(c.l)} ${n(c.c)} ${n(c.h)}${(c.alpha ?? 1) < 1 ? ` / ${n(c.alpha)}` : ""})`
}

const root = block(":root"), dark = block(".dark")
const fonts = {
  "font-sans": 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  "font-heading": 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  "font-mono": 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
}
const colors = Object.keys(root).filter(name => name !== "radius")
const mode = (scope: Record<string, string>) => ({
  ...Object.fromEntries(colors.map(name => [name, format(resolve(scope[name], scope))])),
  radius: root.radius,
  ...fonts,
})
const out = { source, colors, light: mode(root), dark: mode({ ...root, ...dark }) }
await fs.writeFile(path.join(import.meta.dir, "../src/coss/defaults.json"), `${JSON.stringify(out, null, 2)}\n`)
console.log(`${colors.length} colors from ${source}`)
