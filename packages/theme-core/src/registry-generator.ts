/**
 * shadcn registry-item generator, ported from tweakcn `utils/registry/themes.ts`.
 *
 * Produces the `registry:style` JSON object (colors forced to oklch). Pure data;
 * no hosted `$schema`-URL fetching, no preset lookup (`generateThemeRegistryFromPreset`
 * is out of scope for this batch).
 *
 * Adaptations vs tweakcn:
 * - Input is `ThemeStyles` directly.
 * - `getShadowMap` uses OUR signature: mode-resolved `ThemeStyleProps`.
 * - `convertThemeStyles` does NOT mutate the caller's input (tweakcn mutated in
 *   place); output is identical.
 */
import type { ThemeStyleProps, ThemeStyles } from "./theme-model";
import { defaultDarkThemeStyles, defaultLightThemeStyles } from "./theme-model";
import { colorFormatter } from "./color-converter";
import { getShadowMap } from "./shadows";

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

// Convert a color to the oklch format expected by the shadcn registry.
const convertToRegistryColor = (color: string): string => colorFormatter(color, "oklch");

// Helper to get a value from either dark or light theme.
const getThemeValue = (
  dark: ThemeStyleProps,
  light: ThemeStyleProps,
  key: keyof ThemeStyleProps
): string => {
  return dark[key] || light[key] || "";
};

const convertThemeStyles = (styles: ThemeStyles) => {
  const { light, dark } = styles;

  const convertTheme = (theme: ThemeStyleProps): ThemeStyleProps => {
    const result: ThemeStyleProps = { ...theme };
    for (const key of COLOR_KEYS) {
      result[key] = convertToRegistryColor(theme[key] || "");
    }
    return result;
  };

  return {
    light: { ...defaultLightThemeStyles, ...convertTheme(light) },
    dark: { ...defaultDarkThemeStyles, ...convertTheme(dark) },
  };
};

export const generateThemeRegistryItemFromStyles = (name: string, themeStyles: ThemeStyles) => {
  const { light, dark } = convertThemeStyles(themeStyles);

  // Generate shadow variables for both light and dark modes.
  const lightShadows = getShadowMap(light);
  const darkShadows = getShadowMap(dark);

  const registryItem = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: "registry:style",
    css: {
      "@layer base": {
        body: {
          "letter-spacing": "var(--tracking-normal)",
        },
      },
    },
    cssVars: {
      theme: {
        "font-sans": getThemeValue(dark, light, "font-sans") || "Inter, sans-serif",
        "font-mono": getThemeValue(dark, light, "font-mono") || "monospace",
        "font-serif": getThemeValue(dark, light, "font-serif") || "serif",
        radius: getThemeValue(dark, light, "radius") || "0.5rem",
        "tracking-tighter": "calc(var(--tracking-normal) - 0.05em)",
        "tracking-tight": "calc(var(--tracking-normal) - 0.025em)",
        "tracking-wide": "calc(var(--tracking-normal) + 0.025em)",
        "tracking-wider": "calc(var(--tracking-normal) + 0.05em)",
        "tracking-widest": "calc(var(--tracking-normal) + 0.1em)",
      },
      light: {
        ...light,
        "shadow-2xs": lightShadows["shadow-2xs"],
        "shadow-xs": lightShadows["shadow-xs"],
        "shadow-sm": lightShadows["shadow-sm"],
        shadow: lightShadows["shadow"],
        "shadow-md": lightShadows["shadow-md"],
        "shadow-lg": lightShadows["shadow-lg"],
        "shadow-xl": lightShadows["shadow-xl"],
        "shadow-2xl": lightShadows["shadow-2xl"],
        "tracking-normal": getThemeValue(dark, light, "letter-spacing") || "0em",
        spacing: getThemeValue(dark, light, "spacing") || "0.25rem",
      },
      dark: {
        ...dark,
        "shadow-2xs": darkShadows["shadow-2xs"],
        "shadow-xs": darkShadows["shadow-xs"],
        "shadow-sm": darkShadows["shadow-sm"],
        shadow: darkShadows["shadow"],
        "shadow-md": darkShadows["shadow-md"],
        "shadow-lg": darkShadows["shadow-lg"],
        "shadow-xl": darkShadows["shadow-xl"],
        "shadow-2xl": darkShadows["shadow-2xl"],
      },
    },
  };

  return registryItem;
};
