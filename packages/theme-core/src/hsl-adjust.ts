/**
 * Global HSL adjustments, ported from tweakcn
 * `components/editor/hsl-adjustment-controls.tsx`.
 *
 * `adjustColorByHsl` 字节对齐 tweakcn:culori 解析为 HSL,移位/缩放后回 hex。
 * 面板用它预览 HSL 预设;主题本身的调整由 `coss/theme.ts` 的 `adjustTheme` 完成。
 */
import { converter, formatHex, type Hsl } from "culori";

export interface HslAdjustments {
  hueShift: number;
  saturationScale: number;
  lightnessScale: number;
}

export const defaultHslAdjustments: HslAdjustments = {
  hueShift: 0,
  saturationScale: 1,
  lightnessScale: 1,
};

// Adjusts a color by modifying HSL values
export function adjustColorByHsl(
  color: string,
  hueShift: number,
  saturationScale: number,
  lightnessScale: number
): string {
  const hsl = converter("hsl")(color);
  const h = hsl?.h;
  const s = hsl?.s;
  const l = hsl?.l;

  if (h === undefined || s === undefined || l === undefined) {
    return color;
  }

  const adjustedHsl = {
    h: (((h + hueShift) % 360) + 360) % 360,
    s: Math.min(1, Math.max(0, s * saturationScale)),
    l: Math.min(1, Math.max(0.1, l * lightnessScale)),
  };

  const out = converter("hsl")(adjustedHsl as Hsl);
  return formatHex(out);
}

export interface HslPreset {
  name: string;
  hueShift: number;
  saturationScale: number;
  lightnessScale: number;
}

// Preset HSL adjustment values (ported verbatim from tweakcn)
export const HSL_PRESETS: HslPreset[] = [
  // Hue Adjustments
  { name: "Hue (-120°)", hueShift: -120, saturationScale: 1, lightnessScale: 1 },
  { name: "Hue (-60°)", hueShift: -60, saturationScale: 1, lightnessScale: 1 },
  { name: "Hue (+60°)", hueShift: 60, saturationScale: 1, lightnessScale: 1 },
  { name: "Hue (+120°)", hueShift: 120, saturationScale: 1, lightnessScale: 1 },
  { name: "Hue Invert", hueShift: 180, saturationScale: 1, lightnessScale: 1 },

  // Saturation Adjustments
  { name: "Grayscale", hueShift: 0, saturationScale: 0, lightnessScale: 1 },
  { name: "Muted", hueShift: 0, saturationScale: 0.6, lightnessScale: 1 },
  { name: "Vibrant", hueShift: 0, saturationScale: 1.4, lightnessScale: 1 },

  // Lightness Adjustments
  { name: "Dimmer", hueShift: 0, saturationScale: 1, lightnessScale: 0.8 },
  { name: "Brighter", hueShift: 0, saturationScale: 1, lightnessScale: 1.2 },

  // Combined Adjustments
  { name: "H(+30) S(-50) L(-5%)", hueShift: 30, saturationScale: 0.5, lightnessScale: 0.95 },
  { name: "H(-20) S(+20) L(+5%)", hueShift: -20, saturationScale: 1.2, lightnessScale: 1.05 },
  { name: "H(+20) S(-30) L(-5%)", hueShift: 20, saturationScale: 0.7, lightnessScale: 0.95 },
  { name: "H(-10) S(-25) L(+10%)", hueShift: -10, saturationScale: 0.75, lightnessScale: 1.1 },
  { name: "H(+60) S(+50) L(+10%)", hueShift: 60, saturationScale: 1.5, lightnessScale: 1.1 },
];
