import type { ThemeOverride } from "./types";

const block = (
  selector: string,
  vars: Record<string, string>,
  formatValue: (v: string) => string
): string => {
  const entries = Object.entries(vars).filter(([, v]) => v && v.trim());
  if (!entries.length) return "";
  const body = entries
    .map(([k, v]) => `  --${k}: ${formatValue(v.trim())};`)
    .join("\n");
  return `${selector} {\n${body}\n}`;
};

/**
 * 把覆盖渲染成 `:root{}` / `.dark{}` 两段。
 * content script 注入与面板导出共用此函数，避免两套逻辑漂移。
 */
export function buildOverrideCss(
  override: ThemeOverride,
  formatValue: (v: string) => string = (v) => v
): string {
  return [
    block(":root", override.light, formatValue),
    block(".dark", override.dark, formatValue),
  ]
    .filter(Boolean)
    .join("\n\n");
}
