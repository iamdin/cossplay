import * as culori from "culori"

export type ColorFormat = "hsl" | "rgb" | "oklch" | "hex"

export const formatNumber = (num?: number) => {
  if (!num) return "0"
  // tweakcn 字节对齐:非整数保留 4 位小数（含尾零，如 0.1450），整数原样返回。
  return num % 1 === 0 ? num : num.toFixed(4)
}

const alphaOf = (color: { alpha?: number }): number | null => {
  const a = color.alpha
  return typeof a === "number" && a < 1 ? a : null
}

export const colorFormatter = (
  colorValue: string,
  format: ColorFormat = "oklch",
  tailwindVersion: "3" | "4" = "4"
): string => {
  try {
    const color = culori.parse(colorValue)
    if (!color) throw new Error("Invalid color input")
    const a = alphaOf(color)

    switch (format) {
      case "hsl": {
        const hsl = culori.converter("hsl")(color)
        // tweakcn parity: v3 hsl emits BARE triples `H S% L%` (consumed by
        // `hsl(var(--x))` in tailwind config); v4 wraps as `hsl(...)`.
        if (tailwindVersion === "3") {
          return `${formatNumber(hsl.h)} ${formatNumber((hsl.s ?? 0) * 100)}% ${formatNumber((hsl.l ?? 0) * 100)}%`
        }
        const head = `hsl(${formatNumber(hsl.h)} ${formatNumber((hsl.s ?? 0) * 100)}% ${formatNumber((hsl.l ?? 0) * 100)}%`
        return a === null ? `${head})` : `${head} / ${formatNumber(a)})`
      }
      case "rgb":
        return culori.formatRgb(color) // 已含 alpha (rgba)
      case "oklch": {
        const oklch = culori.converter("oklch")(color)
        const head = `oklch(${formatNumber(oklch.l)} ${formatNumber(oklch.c)} ${formatNumber(oklch.h)}`
        return a === null ? `${head})` : `${head} / ${formatNumber(a)})`
      }
      case "hex":
        return a === null ? culori.formatHex(color) : culori.formatHex8(color)
      default:
        return colorValue
    }
  } catch (error) {
    console.error(`Failed to convert color: ${colorValue}`, error)
    return colorValue
  }
}

/** 解析任意颜色为 #rrggbb（丢 alpha）；失败回退原值。 */
export const toHex = (colorValue: string): string => {
  const parsed = culori.parse(colorValue)
  if (!parsed) return colorValue
  return culori.formatHex(parsed)
}

/** 解析任意颜色为 8 位 #rrggbbaa（不透明则补 ff）；失败回退原值。供 alpha 取色器使用。 */
export const toHex8 = (colorValue: string): string => {
  const parsed = culori.parse(colorValue)
  if (!parsed) return colorValue
  return culori.formatHex8(parsed)
}
