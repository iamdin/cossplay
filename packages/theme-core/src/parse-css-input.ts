/**
 * Parse a pasted shadcn `globals.css` (or fragment) into light/dark token maps.
 *
 * Ported byte-faithfully from tweakcn `utils/parse-css-input.ts`. Adaptations:
 * - whitelist = keys of OUR `defaultThemeStyles.light`.
 * - `COMMON_STYLES` (non-color) kept verbatim; all other (color) values are
 *   normalized to hex via `colorFormatter(processColorValue(v), "hex")`.
 * - Only `:root` and `.dark` blocks are read; unknown vars are dropped.
 */
import type { ThemeStyleProps } from "./theme-model";
import { COMMON_STYLES, defaultThemeStyles } from "./theme-model";
import { colorFormatter } from "./color-converter";

export const variableNames = Object.keys(defaultThemeStyles.light);
const nonColorVariables: readonly string[] = COMMON_STYLES;
const VARIABLE_PREFIX = "--";

export const parseCssInput = (
  input: string
): { lightColors: Partial<ThemeStyleProps>; darkColors: Partial<ThemeStyleProps> } => {
  const lightColors: Partial<ThemeStyleProps> = {};
  const darkColors: Partial<ThemeStyleProps> = {};

  try {
    const rootContent = extractCssBlockContent(input, ":root");
    const darkContent = extractCssBlockContent(input, ".dark");

    if (rootContent) {
      parseColorVariables(rootContent, lightColors, variableNames);
    }
    if (darkContent) {
      parseColorVariables(darkContent, darkColors, variableNames);
    }
  } catch (error) {
    console.error("Error parsing CSS input:", error);
  }

  return { lightColors, darkColors };
};

const extractCssBlockContent = (input: string, selector: string): string | null => {
  const regex = new RegExp(`${escapeRegExp(selector)}\\s*{([^}]+)}`);
  return input.match(regex)?.[1]?.trim() || null;
};

const parseColorVariables = (
  cssContent: string,
  target: Partial<ThemeStyleProps>,
  validNames: string[]
) => {
  const variableDeclarations = cssContent.match(/--[^:]+:\s*[^;]+/g) || [];

  variableDeclarations.forEach((declaration) => {
    const [name, value] = declaration.split(":").map((part) => part.trim());
    const cleanName = name.replace(VARIABLE_PREFIX, "");

    if (validNames.includes(cleanName)) {
      if (nonColorVariables.includes(cleanName)) {
        target[cleanName as keyof ThemeStyleProps] = value;
        return;
      }

      const colorValue = processColorValue(value);
      const formattedValue = colorFormatter(colorValue, "hex");
      target[cleanName as keyof ThemeStyleProps] = formattedValue;
    }
  });
};

const processColorValue = (value: string): string => {
  return /^\d/.test(value) ? `hsl(${value})` : value;
};

// Helper function to escape regex special characters
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
