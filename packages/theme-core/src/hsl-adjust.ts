/**
 * Global HSL adjustments, ported from tweakcn
 * `components/editor/hsl-adjustment-controls.tsx`.
 *
 * `adjustColorByHsl` 字节对齐 tweakcn:culori 解析为 HSL,移位/缩放后回 hex。
 * `applyHslAdjustmentsToStyles` 是 UI 调用的纯函数:以 checkpoint styles 为
 * base,对 light/dark 两套里所有颜色 token 应用调整(跳过 COMMON_STYLES),
 * 返回全新对象引用(便于 Zustand 订阅触发)。Panel-side only — culori 可用。
 */
import { converter, formatHex, type Hsl } from "culori";
import { COMMON_STYLES, type ThemeStyleProps, type ThemeStyles } from "./theme-model";

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

const COMMON_STYLE_KEYS = new Set<string>(COMMON_STYLES);

/** 对单套 styles 应用 HSL 调整,跳过 COMMON_STYLES(字体/圆角/阴影几何/字距/间距)。 */
function adjustStyleProps(styles: ThemeStyleProps, adj: HslAdjustments): ThemeStyleProps {
  const out = { ...styles };
  for (const key of Object.keys(out) as (keyof ThemeStyleProps)[]) {
    if (COMMON_STYLE_KEYS.has(key)) continue;
    out[key] = adjustColorByHsl(
      out[key] || "",
      adj.hueShift,
      adj.saturationScale,
      adj.lightnessScale
    );
  }
  return out;
}

/**
 * 以 `base` 为基准非破坏式重算:对 light 和 dark 两套里的每个颜色 token 应用
 * `adjustColorByHsl`,COMMON_STYLES 中的 key 原样保留。返回全新 ThemeStyles
 * (新的 light/dark 对象引用),即便恒等调整也复制一份。
 */
export function applyHslAdjustmentsToStyles(
  base: ThemeStyles,
  adj: HslAdjustments
): ThemeStyles {
  return {
    light: adjustStyleProps(base.light, adj),
    dark: adjustStyleProps(base.dark, adj),
  };
}
