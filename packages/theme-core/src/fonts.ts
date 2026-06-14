export interface Font {
  id: string;
  label: string;
  /** CSS font-family 值（存入 base["font-sans"]/["font-mono"]）。 */
  stack: string;
  kind: "sans" | "mono";
  /** 有则需注入 Google webfont。 */
  google?: { family: string; weights: number[] };
}

export const FONTS: Font[] = [
  { id: "system-sans", label: "系统默认", stack: "ui-sans-serif, system-ui, sans-serif", kind: "sans" },
  { id: "inter", label: "Inter", stack: "'Inter', ui-sans-serif, system-ui, sans-serif", kind: "sans", google: { family: "Inter", weights: [400, 500, 600, 700] } },
  { id: "geist", label: "Geist", stack: "'Geist', ui-sans-serif, system-ui, sans-serif", kind: "sans", google: { family: "Geist", weights: [400, 500, 600, 700] } },
  { id: "manrope", label: "Manrope", stack: "'Manrope', ui-sans-serif, system-ui, sans-serif", kind: "sans", google: { family: "Manrope", weights: [400, 500, 600, 700] } },
  { id: "roboto", label: "Roboto", stack: "'Roboto', ui-sans-serif, system-ui, sans-serif", kind: "sans", google: { family: "Roboto", weights: [400, 500, 700] } },
  { id: "system-mono", label: "系统等宽", stack: "ui-monospace, monospace", kind: "mono" },
  { id: "jetbrains-mono", label: "JetBrains Mono", stack: "'JetBrains Mono', ui-monospace, monospace", kind: "mono", google: { family: "JetBrains Mono", weights: [400, 500, 700] } },
  { id: "fira-code", label: "Fira Code", stack: "'Fira Code', ui-monospace, monospace", kind: "mono", google: { family: "Fira Code", weights: [400, 500, 700] } },
  { id: "geist-mono", label: "Geist Mono", stack: "'Geist Mono', ui-monospace, monospace", kind: "mono", google: { family: "Geist Mono", weights: [400, 500, 700] } },
];

export function findFontByStack(stack: string): Font | undefined {
  return FONTS.find((f) => f.stack === stack);
}

/** 由当前选中的字体栈算出 Google webfont URL；无 Google 字体则 null。 */
export function googleFontHref(stacks: string[]): string | null {
  const families = stacks
    .map(findFontByStack)
    .filter((f): f is Font => !!f && !!f.google)
    .map((f) => `family=${f.google!.family.replace(/ /g, "+")}:wght@${f.google!.weights.join(";")}`);
  if (!families.length) return null;
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
