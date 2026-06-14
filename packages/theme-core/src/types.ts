export type ThemeMode = "light" | "dark";

/** token key 不带 `--` 前缀，如 "primary"、"sidebar-ring"。 */
export interface ThemeOverride {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export const emptyOverride = (): ThemeOverride => ({ light: {}, dark: {} });
