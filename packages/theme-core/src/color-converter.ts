import * as culori from "culori";

export type ColorFormat = "hsl" | "rgb" | "oklch" | "hex";

export const formatNumber = (num?: number) => {
  if (!num) return "0";
  return num % 1 === 0 ? num : Number(num.toFixed(4));
};

export const colorFormatter = (
  colorValue: string,
  format: ColorFormat = "oklch"
): string => {
  try {
    const color = culori.parse(colorValue);
    if (!color) throw new Error("Invalid color input");

    switch (format) {
      case "hsl": {
        const hsl = culori.converter("hsl")(color);
        return `hsl(${formatNumber(hsl.h)} ${formatNumber((hsl.s ?? 0) * 100)}% ${formatNumber((hsl.l ?? 0) * 100)}%)`;
      }
      case "rgb":
        return culori.formatRgb(color);
      case "oklch": {
        const oklch = culori.converter("oklch")(color);
        return `oklch(${formatNumber(oklch.l)} ${formatNumber(oklch.c)} ${formatNumber(oklch.h)})`;
      }
      case "hex":
        return culori.formatHex(color);
      default:
        return colorValue;
    }
  } catch (error) {
    console.error(`Failed to convert color: ${colorValue}`, error);
    return colorValue;
  }
};

/** 解析任意颜色为 #rrggbb；失败回退原值。供取色器显示用。 */
export const toHex = (colorValue: string): string => {
  const parsed = culori.parse(colorValue);
  if (!parsed) return colorValue;
  return culori.formatHex(parsed);
};
