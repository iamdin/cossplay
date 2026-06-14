/**
 * Full-token CSS-variable generator producing the `:root { ... }` + `.dark { ... }`
 * shape the extension injects.
 *
 * Based on the CSS-variable-emitting portion of tweakcn
 * `utils/theme-style-generator.ts` (generateColorVariables / generateFontVariables /
 * generateShadowVariables), but ONLY the `:root`/`.dark` variable blocks — no
 * `@theme inline`, no `@layer base`, no Tailwind import (those belong to M3 export).
 *
 * Style matches the existing `override-css.ts`: 2-space indent, `\n\n` between blocks.
 */
import type { ThemeStyles, ThemeStyleProps } from "./theme-model";
import { defaultLightThemeStyles } from "./theme-model";
import { colorFormatter, type ColorFormat } from "./color-converter";
import { getShadowMap } from "./shadows";

/** Color tokens emitted, in tweakcn order. */
const COLOR_KEYS: (keyof ThemeStyleProps)[] = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
];

const SHADOW_KEYS = [
  "shadow-2xs",
  "shadow-xs",
  "shadow-sm",
  "shadow",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
  "shadow-2xl",
];

const line = (key: string, value: string) => `  --${key}: ${value};`;

function modeBlock(
  selector: string,
  styles: ThemeStyleProps,
  isLight: boolean,
  formatColor: (color: string) => string
): string {
  const lines: string[] = [];

  for (const key of COLOR_KEYS) {
    lines.push(line(key, formatColor(styles[key])));
  }

  // Fonts
  lines.push(line("font-sans", styles["font-sans"]));
  lines.push(line("font-serif", styles["font-serif"]));
  lines.push(line("font-mono", styles["font-mono"]));

  // Radius
  lines.push(line("radius", styles.radius));

  // Raw shadow primitives (tweakcn emits these alongside the computed ones)
  lines.push(line("shadow-x", styles["shadow-offset-x"]));
  lines.push(line("shadow-y", styles["shadow-offset-y"]));
  lines.push(line("shadow-blur", styles["shadow-blur"]));
  lines.push(line("shadow-spread", styles["shadow-spread"]));
  lines.push(line("shadow-opacity", styles["shadow-opacity"]));
  lines.push(line("shadow-color", styles["shadow-color"]));

  // Computed shadow strings
  const shadowMap = getShadowMap(styles);
  for (const key of SHADOW_KEYS) {
    lines.push(line(key, shadowMap[key]));
  }

  // Tracking + spacing live on :root (light) only, mirroring tweakcn.
  if (isLight) {
    const tracking = styles["letter-spacing"] ?? defaultLightThemeStyles["letter-spacing"];
    lines.push(line("tracking-normal", tracking));
    lines.push(line("spacing", styles.spacing ?? defaultLightThemeStyles.spacing));
  }

  return `${selector} {\n${lines.join("\n")}\n}`;
}

/**
 * Generate the full-token `:root`/`.dark` CSS the extension injects.
 *
 * @param styles  complete ThemeStyles (use `normalizeThemeStyles` first if partial).
 * @param opts.colorFormat  color output format (default "oklch"; alpha preserved).
 */
export function generateThemeCss(
  styles: ThemeStyles,
  opts: { colorFormat?: ColorFormat } = {}
): string {
  const colorFormat = opts.colorFormat ?? "oklch";
  const formatColor = (color: string) => colorFormatter(color, colorFormat);

  const root = modeBlock(":root", styles.light, true, formatColor);
  const dark = modeBlock(".dark", styles.dark, false, formatColor);

  return `${root}\n\n${dark}`;
}
