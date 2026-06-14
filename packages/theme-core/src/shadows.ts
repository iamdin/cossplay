/**
 * Shadow string generation, ported from tweakcn `utils/shadows.ts`.
 *
 * Computes the 8 shadow strings (2xs..2xl) from the 6 shadow primitives.
 * Adapted to accept `ThemeStyleProps` (or just the shadow fields) instead of
 * tweakcn's `ThemeEditorState`. Panel-side only — culori is fine here.
 */
import * as culori from "culori";
import type { ThemeStyleProps } from "./theme-model";
import { formatNumber } from "./color-converter";

/** Fields `getShadowMap` actually reads. */
export type ShadowInput = Pick<
  ThemeStyleProps,
  | "shadow-color"
  | "shadow-opacity"
  | "shadow-blur"
  | "shadow-spread"
  | "shadow-offset-x"
  | "shadow-offset-y"
>;

/**
 * Bare `H S% L%` string (no `hsl(...)` wrapper) — matches tweakcn's
 * `colorFormatter(color, "hsl", "3")` output, which getShadowMap then wraps
 * itself as `hsl(<bare> / <alpha>)`.
 */
const toBareHsl = (colorValue: string): string => {
  try {
    const parsed = culori.parse(colorValue);
    if (!parsed) return colorValue;
    const hsl = culori.converter("hsl")(parsed);
    return `${formatNumber(hsl.h)} ${formatNumber((hsl.s ?? 0) * 100)}% ${formatNumber((hsl.l ?? 0) * 100)}%`;
  } catch {
    return colorValue;
  }
};

/**
 * Returns the 8-entry shadow map keyed by:
 * `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`,
 * `shadow-xl`, `shadow-2xl`.
 */
export const getShadowMap = (styles: ShadowInput): Record<string, string> => {
  const hsl = toBareHsl(styles["shadow-color"]);
  const offsetX = styles["shadow-offset-x"];
  const offsetY = styles["shadow-offset-y"];
  const blur = styles["shadow-blur"];
  const spread = styles["shadow-spread"];
  const opacity = parseFloat(styles["shadow-opacity"]);

  const color = (opacityMultiplier: number) =>
    `hsl(${hsl} / ${(opacity * opacityMultiplier).toFixed(2)})`;

  const secondLayer = (fixedOffsetY: string, fixedBlur: string): string => {
    const offsetX2 = offsetX;
    const offsetY2 = fixedOffsetY;
    const blur2 = fixedBlur;
    const spread2 = (parseFloat(spread?.replace("px", "") ?? "0") - 1).toString() + "px";
    const color2 = color(1.0);
    return `${offsetX2} ${offsetY2} ${blur2} ${spread2} ${color2}`;
  };

  return {
    "shadow-2xs": `${offsetX} ${offsetY} ${blur} ${spread} ${color(0.5)}`,
    "shadow-xs": `${offsetX} ${offsetY} ${blur} ${spread} ${color(0.5)}`,
    "shadow-2xl": `${offsetX} ${offsetY} ${blur} ${spread} ${color(2.5)}`,

    "shadow-sm": `${offsetX} ${offsetY} ${blur} ${spread} ${color(1.0)}, ${secondLayer("1px", "2px")}`,
    shadow: `${offsetX} ${offsetY} ${blur} ${spread} ${color(1.0)}, ${secondLayer("1px", "2px")}`,
    "shadow-md": `${offsetX} ${offsetY} ${blur} ${spread} ${color(1.0)}, ${secondLayer("2px", "4px")}`,
    "shadow-lg": `${offsetX} ${offsetY} ${blur} ${spread} ${color(1.0)}, ${secondLayer("4px", "6px")}`,
    "shadow-xl": `${offsetX} ${offsetY} ${blur} ${spread} ${color(1.0)}, ${secondLayer("8px", "10px")}`,
  };
};
