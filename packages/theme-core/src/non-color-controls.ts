export interface NonColorControl {
  /** token key（不带 `--`）。 */
  token: string;
  label: string;
  kind: "slider" | "font";
  /** slider 用。 */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/** coss 真实可主题化的非颜色 token（顺序即显示顺序）。 */
export const NON_COLOR_CONTROLS: NonColorControl[] = [
  { token: "radius", label: "圆角", kind: "slider", min: 0, max: 2, step: 0.025, unit: "rem" },
  { token: "spacing", label: "间距(全局)", kind: "slider", min: 0.15, max: 0.35, step: 0.005, unit: "rem" },
  { token: "font-sans", label: "界面字体", kind: "font" },
  { token: "font-mono", label: "等宽字体", kind: "font" },
];

export const NON_COLOR_TOKENS: Set<string> = new Set(
  NON_COLOR_CONTROLS.map((c) => c.token)
);
