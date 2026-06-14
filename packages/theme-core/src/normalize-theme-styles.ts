/**
 * Coerce arbitrary/partial input into a complete `ThemeStyles` by overlaying it
 * onto defaults. Handles three shapes:
 *
 *   (a) a full `{ light, dark }` ThemeStyles  -> overlay both modes
 *   (b) a legacy M1 delta `{ base, light, dark }` where `base` holds non-color
 *       tokens (radius/spacing/fonts...) -> overlay base onto BOTH modes, then
 *       overlay light/dark colors on top.
 *   (c) null / garbage -> defaults clone
 *
 * Always deep-copies; never aliases the provided defaults.
 */
import type { ThemeStyles, ThemeStyleProps } from "./theme-model";
import { defaultThemeStyles } from "./theme-model";

const isRecord = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);

/** Shallow copy of a defaults mode, then overlay any string-valued keys from `partial`. */
const overlay = (
  base: ThemeStyleProps,
  partial: Record<string, unknown> | undefined
): ThemeStyleProps => {
  const out = { ...base } as Record<string, unknown>;
  if (partial) {
    for (const [k, v] of Object.entries(partial)) {
      if (typeof v === "string") out[k] = v;
    }
  }
  return out as unknown as ThemeStyleProps;
};

export function normalizeThemeStyles(
  raw: unknown,
  defaults: ThemeStyles = defaultThemeStyles
): ThemeStyles {
  // Deep-copy defaults so we never alias them.
  const baseLight = { ...defaults.light };
  const baseDark = { ...defaults.dark };

  if (!isRecord(raw)) {
    return { light: baseLight, dark: baseDark };
  }

  const rawLight = isRecord(raw.light) ? raw.light : undefined;
  const rawDark = isRecord(raw.dark) ? raw.dark : undefined;
  const rawBase = isRecord(raw.base) ? raw.base : undefined;

  // Legacy M1 delta: apply `base` (non-color tokens) to both modes first.
  const seededLight = overlay(baseLight, rawBase);
  const seededDark = overlay(baseDark, rawBase);

  return {
    light: overlay(seededLight, rawLight),
    dark: overlay(seededDark, rawDark),
  };
}
