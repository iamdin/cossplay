import {
  converter,
  formatHex,
  formatHex8,
  formatRgb,
  parse,
  wcagContrast,
} from "culori"

export type ColorFormat = "triplet" | "hex" | "oklch" | "hsl" | "rgb" | "lab"
const number = (v: number | undefined) => Number((v ?? 0).toFixed(5))
const triplet =
  /^[-\d.]+(?:deg|grad|rad|turn)?\s+[-\d.]+%\s+[-\d.]+%(?:\s*\/\s*[\d.%]+)?$/i
export function parseColor(value: string) {
  const source = value
    .trim()
    .toLowerCase()
    .replace(/\/\s*none\s*\)$/, "/ 0)")
  const color = parse(triplet.test(source) ? `hsl(${source})` : source)
  const rgb = color && converter("rgb")(color)
  return rgb && [rgb.r, rgb.g, rgb.b, rgb.alpha ?? 1].every(Number.isFinite)
    ? rgb
    : undefined
}
export function sourceFormat(value: string): ColorFormat {
  if (value.trim().startsWith("#")) return "hex"
  if (triplet.test(value.trim())) return "triplet"
  if (/^\s*lab\(/i.test(value)) return "lab"
  if (/^\s*rgb/i.test(value)) return "rgb"
  if (/^\s*hsl/i.test(value)) return "hsl"
  return "oklch"
}
export function formatColor(value: string, format: ColorFormat): string {
  const color = parseColor(value)
  if (!color) throw Error(`Invalid color: ${value}`)
  const alpha = color.alpha ?? 1
  const suffix = alpha < 1 ? ` / ${number(alpha)}` : ""
  if (format === "hex") return alpha < 1 ? formatHex8(color) : formatHex(color)
  if (format === "rgb") return formatRgb(color)
  if (format === "hsl" || format === "triplet") {
    const c = converter("hsl")(color)!
    const raw = `${number(c.h)} ${number(c.s * 100)}% ${number(c.l * 100)}%${suffix}`
    return format === "triplet" ? raw : `hsl(${raw})`
  }
  if (format === "lab") {
    const c = converter("lab")(color)!
    return `lab(${number(c.l)}% ${number(c.a)} ${number(c.b)}${suffix})`
  }
  const c = converter("oklch")(color)!
  return `oklch(${number(c.l)} ${number(c.c)} ${number(c.h)}${suffix})`
}
export function adjustColor(
  value: string,
  hue: number,
  saturation: number,
  lightness: number
) {
  const c = converter("hsl")(parseColor(value))
  if (!c) throw Error(`Invalid color: ${value}`)
  return formatColor(
    `hsl(${number(((c.h ?? 0) + hue + 720) % 360)} ${number(Math.min(1, Math.max(0, c.s * saturation)) * 100)}% ${number(Math.min(1, Math.max(0.1, c.l * lightness)) * 100)}% / ${c.alpha ?? 1})`,
    "hex"
  )
}
export function contrast(
  foreground: string,
  background: string,
  canvas = "#ffffff"
) {
  const rgb = converter("rgb")
  const composite = (top: string, bottom: string) => {
    const a = rgb(parseColor(top))!,
      b = rgb(parseColor(bottom))!
    const opacity = a.alpha ?? 1
    return formatRgb({
      mode: "rgb",
      r: a.r * opacity + b.r * (1 - opacity),
      g: a.g * opacity + b.g * (1 - opacity),
      b: a.b * opacity + b.b * (1 - opacity),
    })
  }
  const bg = composite(background, canvas)
  return wcagContrast(composite(foreground, bg), bg)
}
