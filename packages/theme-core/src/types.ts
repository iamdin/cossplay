export type ThemeMode = "light" | "dark";

/**
 * token key 不带 `--` 前缀，如 "primary"、"sidebar-ring"、"radius"。
 * - base: 与明暗无关的 token（radius / spacing / font-sans / font-mono），注入 :root。
 * - light / dark: 颜色 token，按模式分别注入。
 */
export interface ThemeOverride {
  base: Record<string, string>;
  light: Record<string, string>;
  dark: Record<string, string>;
}

export const emptyOverride = (): ThemeOverride => ({ base: {}, light: {}, dark: {} });

const toRecord = (x: unknown): Record<string, string> =>
  x && typeof x === "object" ? { ...(x as Record<string, string>) } : {};

/** 把任意（可能是旧 {light,dark} 或残缺的）对象补全为合法 ThemeOverride，并浅拷贝各桶。 */
export function normalizeOverride(raw: unknown): ThemeOverride {
  const o = (raw ?? {}) as Partial<ThemeOverride>;
  return { base: toRecord(o.base), light: toRecord(o.light), dark: toRecord(o.dark) };
}
