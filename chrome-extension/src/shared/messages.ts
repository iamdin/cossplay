import type { ThemeOverride } from "theme-core";

export interface DiscoverResult {
  /** 发现的全部颜色 token 名（不带 `--`）。 */
  names: string[];
  /** light 模式解析后的默认色值（#hex）。 */
  light: Record<string, string>;
  /** dark 模式解析后的默认色值（#hex）。 */
  dark: Record<string, string>;
}

export type PanelToBg =
  | { type: "set-vars"; override: ThemeOverride }
  | { type: "reset-vars" }
  | { type: "get-vars" }
  | { type: "reload-target" };

export type BgToContent =
  | { type: "apply-vars"; override: ThemeOverride }
  | { type: "reset-vars" }
  | { type: "get-vars" };

export const STORAGE_KEY = "cossThemeOverride";
