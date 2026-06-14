export interface DiscoverResult {
  /** 发现的全部颜色 token 名（不带 `--`）。 */
  names: string[];
  /** light 模式解析后的默认色值。 */
  light: Record<string, string>;
  /** dark 模式解析后的默认色值。 */
  dark: Record<string, string>;
  /** 非颜色 token（radius/spacing/font-*）从页面读到的当前默认值。 */
  base: Record<string, string>;
}

export type PanelToBg =
  | { type: "reset-vars" }
  | { type: "get-vars" }
  | { type: "apply-css"; css: string };

export type BgToContent =
  | { type: "reset-vars" }
  | { type: "get-vars" }
  | { type: "apply-css"; css: string };

/** Storage key for the panel-generated CSS string (M2 dumb-injector path). */
export const STORAGE_KEY_CSS = "cossThemeCss";
