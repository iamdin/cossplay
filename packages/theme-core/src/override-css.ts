import type { ThemeOverride } from "./types";

/** entries 已是最终值；过滤空白后拼成一段。 */
const block = (selector: string, entries: [string, string][]): string => {
  const filtered = entries.filter(([, v]) => v && v.trim());
  if (!filtered.length) return "";
  const body = filtered.map(([k, v]) => `  --${k}: ${v};`).join("\n");
  return `${selector} {\n${body}\n}`;
};

/**
 * 渲染成 `:root{}` / `.dark{}`。
 * - base 注入 :root（原样，不做颜色格式化），故对两种模式都生效。
 * - light 注入 :root，dark 注入 .dark；两者的值经 formatColor。
 * content script 注入与面板导出共用此函数，避免漂移。
 */
export function buildOverrideCss(
  override: ThemeOverride,
  formatColor: (v: string) => string = (v) => v
): string {
  const base = override.base ?? {};
  const light = override.light ?? {};
  const dark = override.dark ?? {};

  const rootEntries: [string, string][] = [
    ...Object.entries(base).map(([k, v]) => [k, v.trim()] as [string, string]),
    ...Object.entries(light).map(([k, v]) => [k, formatColor(v.trim())] as [string, string]),
  ];
  const darkEntries: [string, string][] = Object.entries(dark).map(
    ([k, v]) => [k, formatColor(v.trim())] as [string, string]
  );

  return [block(":root", rootEntries), block(".dark", darkEntries)]
    .filter(Boolean)
    .join("\n\n");
}
