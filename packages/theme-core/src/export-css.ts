import type { ThemeOverride } from "./types";
import { colorFormatter, type ColorFormat } from "./color-converter";
import { buildOverrideCss } from "./override-css";

/** 导出：把值统一格式化（默认 oklch）。基于共享的 buildOverrideCss。 */
export function exportCss(
  override: ThemeOverride,
  format: ColorFormat = "oklch"
): string {
  return buildOverrideCss(override, (v) => colorFormatter(v, format));
}
