# M1 Token Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the coss-ui-theme-tweak extension from colors-only to coss's full themeable surface — alpha-correct colors, `--radius`/`--spacing` sliders, and a UI-font override — by adding a mode-independent `base` token bucket.

**Architecture:** All shared logic lives in `packages/theme-core` (pure, tree-shakeable, `sideEffects:false` so culori never enters the content bundle). `ThemeOverride` gains a `base` bucket injected into `:root` (applies to both modes); colors stay per-mode in `light`/`dark`. The content script normalizes any stored override and injects an optional Google-Fonts `<link>`. The background service worker forwards overrides opaquely (no change). Non-color controls are driven by a static config (`NON_COLOR_CONTROLS` / `FONTS`), not page discovery, because coss doesn't expose those as readable color vars.

**Tech Stack:** TypeScript, culori, react-colorful (`HexAlphaColorPicker`), Base UI Select, Vitest (jsdom), Playwright. bun + turbo monorepo.

**Branch:** `feat/m1-token-editing` (already created off `feat/v1-theme-editor`).

**Spec:** `docs/superpowers/specs/2026-06-14-m1-token-editing-design.md`

---

## Conventions

- Run a single theme-core test file: `cd packages/theme-core && bunx vitest run src/__tests__/<file>.test.ts`
- Run all unit tests from repo root: `bun run test`
- Build everything: `bun run build`
- Content/background bundles MUST stay self-contained IIFE: after build, `grep -c "import" chrome-extension/dist/contentScript.js` and `…/background.js` must both print `0`, and `chrome-extension/dist/assets` must not exist.

---

## Task 1: Data model — `base` bucket + `normalizeOverride`

**Files:**
- Modify: `packages/theme-core/src/types.ts`
- Test: `packages/theme-core/src/__tests__/normalize-override.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/theme-core/src/__tests__/normalize-override.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { emptyOverride, normalizeOverride } from "../types";

describe("emptyOverride", () => {
  it("has base, light, dark", () => {
    expect(emptyOverride()).toEqual({ base: {}, light: {}, dark: {} });
  });
});

describe("normalizeOverride", () => {
  it("adds missing base to a legacy {light,dark} object", () => {
    const out = normalizeOverride({ light: { primary: "red" }, dark: {} });
    expect(out).toEqual({ base: {}, light: { primary: "red" }, dark: {} });
  });

  it("is idempotent on a valid override", () => {
    const valid = { base: { radius: "1rem" }, light: {}, dark: {} };
    expect(normalizeOverride(valid)).toEqual(valid);
  });

  it("returns an empty override for null/garbage", () => {
    expect(normalizeOverride(null)).toEqual({ base: {}, light: {}, dark: {} });
    expect(normalizeOverride(42)).toEqual({ base: {}, light: {}, dark: {} });
  });

  it("copies (does not alias) the input buckets", () => {
    const input = { base: {}, light: { primary: "red" }, dark: {} };
    const out = normalizeOverride(input);
    out.light.primary = "blue";
    expect(input.light.primary).toBe("red");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/theme-core && bunx vitest run src/__tests__/normalize-override.test.ts`
Expected: FAIL — `normalizeOverride` is not exported.

- [ ] **Step 3: Implement**

Replace the entire contents of `packages/theme-core/src/types.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/theme-core && bunx vitest run src/__tests__/normalize-override.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/theme-core/src/types.ts packages/theme-core/src/__tests__/normalize-override.test.ts
git commit -m "feat(theme-core): add base bucket + normalizeOverride to ThemeOverride"
```

---

## Task 2: `buildOverrideCss` — base into `:root`, format colors only

**Files:**
- Modify: `packages/theme-core/src/override-css.ts`
- Test: `packages/theme-core/src/__tests__/override-css.test.ts` (update existing)

- [ ] **Step 1: Update the test (will fail)**

Replace the entire contents of `packages/theme-core/src/__tests__/override-css.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildOverrideCss } from "../override-css";

describe("buildOverrideCss", () => {
  it("emits :root and .dark blocks from changed color tokens", () => {
    const css = buildOverrideCss({
      base: {},
      light: { primary: "oklch(0.5 0 0)" },
      dark: { primary: "oklch(0.8 0 0)" },
    });
    expect(css).toBe(
      ":root {\n  --primary: oklch(0.5 0 0);\n}\n\n.dark {\n  --primary: oklch(0.8 0 0);\n}"
    );
  });

  it("puts base tokens in :root, never in .dark", () => {
    const css = buildOverrideCss({
      base: { radius: "1rem", spacing: "0.3rem" },
      light: {},
      dark: { primary: "red" },
    });
    expect(css).toBe(
      ":root {\n  --radius: 1rem;\n  --spacing: 0.3rem;\n}\n\n.dark {\n  --primary: red;\n}"
    );
  });

  it("orders :root as base first, then light", () => {
    const css = buildOverrideCss({
      base: { radius: "1rem" },
      light: { primary: "red" },
      dark: {},
    });
    expect(css).toBe(":root {\n  --radius: 1rem;\n  --primary: red;\n}");
  });

  it("does NOT run formatColor on base values, only on colors", () => {
    const css = buildOverrideCss(
      { base: { radius: "0.625rem" }, light: { primary: "x" }, dark: {} },
      (v) => `FMT(${v})`
    );
    expect(css).toBe(":root {\n  --radius: 0.625rem;\n  --primary: FMT(x);\n}");
  });

  it("omits .dark block when no dark changes", () => {
    expect(buildOverrideCss({ base: {}, light: { primary: "red" }, dark: {} })).toBe(
      ":root {\n  --primary: red;\n}"
    );
  });

  it("returns empty string for no changes", () => {
    expect(buildOverrideCss({ base: {}, light: {}, dark: {} })).toBe("");
  });

  it("skips blank values", () => {
    expect(buildOverrideCss({ base: { radius: "  " }, light: { primary: "  " }, dark: {} })).toBe("");
  });

  it("tolerates a legacy object missing base", () => {
    const css = buildOverrideCss({ light: { primary: "red" }, dark: {} } as never);
    expect(css).toBe(":root {\n  --primary: red;\n}");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/theme-core && bunx vitest run src/__tests__/override-css.test.ts`
Expected: FAIL — base tokens not emitted / formatColor applied to base.

- [ ] **Step 3: Implement**

Replace the entire contents of `packages/theme-core/src/override-css.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/theme-core && bunx vitest run src/__tests__/override-css.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/theme-core/src/override-css.ts packages/theme-core/src/__tests__/override-css.test.ts
git commit -m "feat(theme-core): inject base tokens into :root, format only color buckets"
```

---

## Task 3: Color converter — alpha support + `toHex8`

**Files:**
- Modify: `packages/theme-core/src/color-converter.ts`
- Test: `packages/theme-core/src/__tests__/color-converter.test.ts` (update existing)

- [ ] **Step 1: Update the test (will fail)**

Replace the entire contents of `packages/theme-core/src/__tests__/color-converter.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { colorFormatter, toHex, toHex8 } from "../color-converter";

describe("colorFormatter", () => {
  it("converts hex to oklch string", () => {
    expect(colorFormatter("#ffffff", "oklch").startsWith("oklch(")).toBe(true);
  });

  it("round-trips opaque hex -> oklch -> hex within tolerance", () => {
    const oklch = colorFormatter("#3b82f6", "oklch");
    expect(toHex(oklch).toLowerCase()).toBe("#3b82f6");
  });

  it("returns input unchanged on invalid color", () => {
    expect(colorFormatter("not-a-color", "oklch")).toBe("not-a-color");
  });

  it("preserves alpha in oklch (emits / a)", () => {
    const out = colorFormatter("#00000080", "oklch"); // ~0.5 alpha
    expect(out).toMatch(/oklch\([^)]+ \/ 0?\.5\d*\)/);
  });

  it("does NOT emit / a for opaque colors", () => {
    expect(colorFormatter("#000000", "oklch")).not.toContain("/");
  });

  it("preserves alpha in rgb (rgba)", () => {
    expect(colorFormatter("#00000080", "rgb")).toMatch(/rgba?\(/);
    expect(colorFormatter("#00000080", "rgb")).toContain("0.5");
  });

  it("emits 8-digit hex when alpha < 1, 6-digit when opaque", () => {
    expect(colorFormatter("#11223380", "hex").length).toBe(9); // #11223380
    expect(colorFormatter("#112233", "hex")).toBe("#112233");
  });
});

describe("toHex", () => {
  it("parses oklch to hex", () => {
    expect(toHex("oklch(1 0 0)").toLowerCase()).toBe("#ffffff");
  });
});

describe("toHex8", () => {
  it("always returns 8-digit hex (ff for opaque)", () => {
    expect(toHex8("#3b82f6").toLowerCase()).toBe("#3b82f6ff");
  });
  it("encodes alpha", () => {
    expect(toHex8("oklch(0 0 0 / 0.5)").toLowerCase().endsWith("80")).toBe(true);
  });
  it("returns input unchanged on invalid color", () => {
    expect(toHex8("nope")).toBe("nope");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/theme-core && bunx vitest run src/__tests__/color-converter.test.ts`
Expected: FAIL — `toHex8` missing; oklch/hex drop alpha.

- [ ] **Step 3: Implement**

Replace the entire contents of `packages/theme-core/src/color-converter.ts`:

```ts
import * as culori from "culori";

export type ColorFormat = "hsl" | "rgb" | "oklch" | "hex";

export const formatNumber = (num?: number) => {
  if (!num) return "0";
  return num % 1 === 0 ? num : Number(num.toFixed(4));
};

const alphaOf = (color: { alpha?: number }): number | null => {
  const a = color.alpha;
  return typeof a === "number" && a < 1 ? a : null;
};

export const colorFormatter = (
  colorValue: string,
  format: ColorFormat = "oklch"
): string => {
  try {
    const color = culori.parse(colorValue);
    if (!color) throw new Error("Invalid color input");
    const a = alphaOf(color);

    switch (format) {
      case "hsl": {
        const hsl = culori.converter("hsl")(color);
        const head = `hsl(${formatNumber(hsl.h)} ${formatNumber((hsl.s ?? 0) * 100)}% ${formatNumber((hsl.l ?? 0) * 100)}%`;
        return a === null ? `${head})` : `${head} / ${formatNumber(a)})`;
      }
      case "rgb":
        return culori.formatRgb(color); // 已含 alpha (rgba)
      case "oklch": {
        const oklch = culori.converter("oklch")(color);
        const head = `oklch(${formatNumber(oklch.l)} ${formatNumber(oklch.c)} ${formatNumber(oklch.h)}`;
        return a === null ? `${head})` : `${head} / ${formatNumber(a)})`;
      }
      case "hex":
        return a === null ? culori.formatHex(color) : culori.formatHex8(color);
      default:
        return colorValue;
    }
  } catch (error) {
    console.error(`Failed to convert color: ${colorValue}`, error);
    return colorValue;
  }
};

/** 解析任意颜色为 #rrggbb（丢 alpha）；失败回退原值。 */
export const toHex = (colorValue: string): string => {
  const parsed = culori.parse(colorValue);
  if (!parsed) return colorValue;
  return culori.formatHex(parsed);
};

/** 解析任意颜色为 8 位 #rrggbbaa（不透明则补 ff）；失败回退原值。供 alpha 取色器使用。 */
export const toHex8 = (colorValue: string): string => {
  const parsed = culori.parse(colorValue);
  if (!parsed) return colorValue;
  return culori.formatHex8(parsed);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/theme-core && bunx vitest run src/__tests__/color-converter.test.ts`
Expected: PASS. If the `#00000080` alpha is formatted as `0.5020` rather than `0.5`, the regex `0?\.5\d*` still matches; the rgb test asserts substring `0.5` — culori formats rgba alpha as `0.5`. If culori emits `0.502`, change the rgb assertion to `.toMatch(/0\.5/)` (already satisfied). Keep tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/theme-core/src/color-converter.ts packages/theme-core/src/__tests__/color-converter.test.ts
git commit -m "feat(theme-core): preserve alpha across formats; add toHex8"
```

---

## Task 4: Non-color control config

**Files:**
- Create: `packages/theme-core/src/non-color-controls.ts`
- Test: `packages/theme-core/src/__tests__/non-color-controls.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/theme-core/src/__tests__/non-color-controls.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { NON_COLOR_CONTROLS, NON_COLOR_TOKENS } from "../non-color-controls";

describe("NON_COLOR_CONTROLS", () => {
  it("includes radius, spacing, font-sans, font-mono", () => {
    const tokens = NON_COLOR_CONTROLS.map((c) => c.token);
    expect(tokens).toEqual(["radius", "spacing", "font-sans", "font-mono"]);
  });

  it("sliders carry min/max/step/unit", () => {
    const radius = NON_COLOR_CONTROLS.find((c) => c.token === "radius")!;
    expect(radius.kind).toBe("slider");
    expect(radius.unit).toBe("rem");
    expect(typeof radius.min).toBe("number");
    expect(typeof radius.max).toBe("number");
    expect(typeof radius.step).toBe("number");
  });

  it("font controls have kind 'font'", () => {
    expect(NON_COLOR_CONTROLS.find((c) => c.token === "font-sans")!.kind).toBe("font");
  });

  it("NON_COLOR_TOKENS is the set of control tokens", () => {
    expect(NON_COLOR_TOKENS.has("radius")).toBe(true);
    expect(NON_COLOR_TOKENS.has("primary")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/theme-core && bunx vitest run src/__tests__/non-color-controls.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `packages/theme-core/src/non-color-controls.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/theme-core && bunx vitest run src/__tests__/non-color-controls.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/theme-core/src/non-color-controls.ts packages/theme-core/src/__tests__/non-color-controls.test.ts
git commit -m "feat(theme-core): non-color control config (radius/spacing/fonts)"
```

---

## Task 5: Font catalog + Google webfont URL

**Files:**
- Create: `packages/theme-core/src/fonts.ts`
- Test: `packages/theme-core/src/__tests__/fonts.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/theme-core/src/__tests__/fonts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { FONTS, findFontByStack, googleFontHref } from "../fonts";

describe("FONTS", () => {
  it("has both sans and mono entries", () => {
    expect(FONTS.some((f) => f.kind === "sans")).toBe(true);
    expect(FONTS.some((f) => f.kind === "mono")).toBe(true);
  });
  it("first sans and first mono are system stacks without google", () => {
    expect(FONTS.find((f) => f.kind === "sans")!.google).toBeUndefined();
    expect(FONTS.find((f) => f.kind === "mono")!.google).toBeUndefined();
  });
});

describe("findFontByStack", () => {
  it("finds a font by its exact stack", () => {
    const inter = FONTS.find((f) => f.id === "inter")!;
    expect(findFontByStack(inter.stack)?.id).toBe("inter");
  });
  it("returns undefined for unknown stack", () => {
    expect(findFontByStack("Comic Sans")).toBeUndefined();
  });
});

describe("googleFontHref", () => {
  it("returns null when no google fonts are selected", () => {
    const systemSans = FONTS.find((f) => f.id === "system-sans")!;
    expect(googleFontHref([systemSans.stack])).toBeNull();
    expect(googleFontHref([])).toBeNull();
  });
  it("builds a css2 url with + for spaces and ; between weights", () => {
    const jb = FONTS.find((f) => f.id === "jetbrains-mono")!;
    const href = googleFontHref([jb.stack]);
    expect(href).toContain("https://fonts.googleapis.com/css2?");
    expect(href).toContain("family=JetBrains+Mono:wght@");
    expect(href).toContain("display=swap");
  });
  it("combines multiple families", () => {
    const inter = FONTS.find((f) => f.id === "inter")!;
    const jb = FONTS.find((f) => f.id === "jetbrains-mono")!;
    const href = googleFontHref([inter.stack, jb.stack])!;
    expect(href).toContain("family=Inter:wght@");
    expect(href).toContain("family=JetBrains+Mono:wght@");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/theme-core && bunx vitest run src/__tests__/fonts.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `packages/theme-core/src/fonts.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/theme-core && bunx vitest run src/__tests__/fonts.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/theme-core/src/fonts.ts packages/theme-core/src/__tests__/fonts.test.ts
git commit -m "feat(theme-core): font catalog + googleFontHref"
```

---

## Task 6: Barrel exports + preset keeps base

**Files:**
- Modify: `packages/theme-core/src/index.ts`
- Modify: `packages/theme-core/src/presets.ts` (only the `presetToOverride` function at the end)
- Test: `packages/theme-core/src/__tests__/presets.test.ts` (update), `packages/theme-core/src/__tests__/export-css.test.ts` (update)

- [ ] **Step 1: Update tests (will fail)**

Replace the entire contents of `packages/theme-core/src/__tests__/presets.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { defaultPresets, presetToOverride } from "../presets";
import { COLOR_TOKENS } from "../tokens";

describe("presets", () => {
  it("loads built-in presets", () => {
    expect(Object.keys(defaultPresets).length).toBeGreaterThan(10);
    expect(defaultPresets["modern-minimal"]).toBeTruthy();
  });

  it("presetToOverride returns base/light/dark with only color tokens", () => {
    const ov = presetToOverride(defaultPresets["modern-minimal"]);
    expect(ov.base).toEqual({});
    for (const k of Object.keys(ov.light)) {
      expect(COLOR_TOKENS.has(k)).toBe(true);
    }
    expect(ov.light.primary).toBeTruthy();
  });
});
```

Replace the entire contents of `packages/theme-core/src/__tests__/export-css.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { exportCss } from "../export-css";

describe("exportCss", () => {
  it("formats color values to oklch", () => {
    const css = exportCss({ base: {}, light: { primary: "#ffffff" }, dark: {} }, "oklch");
    expect(css).toContain("--primary: oklch(");
  });

  it("emits base tokens unformatted in :root", () => {
    const css = exportCss({ base: { radius: "0.5rem" }, light: {}, dark: {} }, "oklch");
    expect(css).toContain("--radius: 0.5rem;");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/theme-core && bunx vitest run src/__tests__/presets.test.ts src/__tests__/export-css.test.ts`
Expected: FAIL — `presetToOverride` has no `base`.

- [ ] **Step 3: Implement**

In `packages/theme-core/src/presets.ts`, replace the `presetToOverride` function (the last function in the file) with:

```ts
/** 把预设取色键裁剪到我们管理的颜色 token，转成 ThemeOverride（base 留空）。 */
export function presetToOverride(preset: ThemePreset): ThemeOverride {
  const pick = (styles: Record<string, string>): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(styles)) {
      if (COLOR_TOKENS.has(k) && typeof v === "string") out[k] = v;
    }
    return out;
  };
  return { base: {}, light: pick(preset.styles.light), dark: pick(preset.styles.dark) };
}
```

Replace the entire contents of `packages/theme-core/src/index.ts`:

```ts
export * from "./types";
export * from "./tokens";
export * from "./non-color-controls";
export * from "./fonts";
export * from "./color-converter";
export * from "./override-css";
export * from "./export-css";
export * from "./presets";
```

- [ ] **Step 4: Run the full theme-core suite**

Run: `bun run test`
Expected: PASS — all theme-core tests green (Task 1–6 files).

- [ ] **Step 5: Commit**

```bash
git add packages/theme-core/src/index.ts packages/theme-core/src/presets.ts packages/theme-core/src/__tests__/presets.test.ts packages/theme-core/src/__tests__/export-css.test.ts
git commit -m "feat(theme-core): export new modules; presetToOverride includes empty base"
```

---

## Task 7: Message contract — `DiscoverResult.base`

**Files:**
- Modify: `chrome-extension/src/shared/messages.ts`

- [ ] **Step 1: Implement (type-only change, no unit test)**

In `chrome-extension/src/shared/messages.ts`, replace the `DiscoverResult` interface:

```ts
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
```

Leave `PanelToBg`, `BgToContent`, `STORAGE_KEY` unchanged.

- [ ] **Step 2: Verify it compiles**

Run: `bun run build`
Expected: build succeeds (no consumers broken yet — content script updated in Task 8).

- [ ] **Step 3: Commit**

```bash
git add chrome-extension/src/shared/messages.ts
git commit -m "feat(ext): add base to DiscoverResult"
```

---

## Task 8: Content script — normalize, discover base, font link

**Files:**
- Modify: `chrome-extension/src/contentScript.ts`

- [ ] **Step 1: Implement**

Apply these edits to `chrome-extension/src/contentScript.ts`:

(a) Replace the top import line:

```ts
import { buildOverrideCss, emptyOverride, normalizeOverride, googleFontHref, NON_COLOR_CONTROLS, type ThemeOverride } from "theme-core";
import { STORAGE_KEY, type BgToContent, type DiscoverResult } from "./shared/messages";
```

(b) Below `const STYLE_ID = "coss-tweak";` add the font link id:

```ts
const FONT_LINK_ID = "coss-tweak-fonts";

/** 按 base 中的字体栈注入/更新/移除 Google webfont <link>（联网,失败不影响其余）。 */
const applyFontLink = (base: Record<string, string>) => {
  const stacks = [base["font-sans"], base["font-mono"]].filter(Boolean) as string[];
  const href = googleFontHref(stacks);
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!href) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
};
```

(c) Update `injectOverride` to also drive the font link:

```ts
const injectOverride = (override: ThemeOverride) => {
  const ov = normalizeOverride(override);
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
  }
  el.textContent = buildOverrideCss(ov);
  document.head.appendChild(el); // 保证在最后，源顺序取胜
  applyFontLink(ov.base);
};
```

(d) `loadStored` and the `guardStyle` re-inject both call `injectOverride`, which now normalizes — no change needed there, but update `guardStyle`'s guard call to pass the raw stored value (injectOverride normalizes):

In `guardStyle`, the inner block already does `if (stored && buildOverrideCss(stored)) injectOverride(stored);`. Replace with:

```ts
        const stored = result[STORAGE_KEY] as ThemeOverride | undefined;
        if (stored) injectOverride(stored);
```

(e) Add a base-defaults reader and include it in `discover`. After the `readResolved` function, add:

```ts
/** 读非颜色 token 的当前默认值（getComputedStyle）。 */
const readBaseDefaults = (): Record<string, string> => {
  const cs = getComputedStyle(document.documentElement);
  const out: Record<string, string> = {};
  for (const c of NON_COLOR_CONTROLS) {
    const v = cs.getPropertyValue(`--${c.token}`).trim();
    if (v) out[c.token] = v;
  }
  return out;
};
```

(f) In `discover`, read base after `removeOverride()` and include it in the return. The function becomes:

```ts
const discover = (): DiscoverResult => {
  styleObserver?.disconnect();

  const names = collectTokens();
  const root = document.documentElement;

  const existing = document.getElementById(STYLE_ID);
  const savedCss = existing?.textContent ?? null;
  removeOverride();

  const base = readBaseDefaults();

  const wasDark = root.classList.contains("dark");
  root.classList.remove("dark");
  const light = readResolved(names);
  root.classList.add("dark");
  const dark = readResolved(names);
  if (wasDark) root.classList.add("dark");
  else root.classList.remove("dark");

  if (savedCss !== null) {
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = savedCss;
    document.head.appendChild(el);
  }

  styleObserver?.observe(document.head, { childList: true });
  return { names, light, dark, base };
};
```

(g) In the `apply-vars` handler, normalize the incoming override (injectOverride already normalizes, but keep the emptyOverride fallback):

The existing line `injectOverride(message.override ?? emptyOverride());` is fine — leave it.

- [ ] **Step 2: Build and verify the bundle stays lean & import-free**

Run:
```bash
bun run build
grep -c "import" chrome-extension/dist/contentScript.js
ls chrome-extension/dist/assets 2>&1
```
Expected: contentScript import count `0`; `dist/assets` does not exist. (culori must NOT be pulled in — `non-color-controls`, `fonts`, `override-css`, `types` are all culori-free.)

- [ ] **Step 3: Sanity-check bundle size**

Run: `bun run build 2>&1 | grep contentScript`
Expected: contentScript.js still only a few KB (no culori). If it jumped to ~40KB, a culori-importing module leaked in — re-check imports.

- [ ] **Step 4: Commit**

```bash
git add chrome-extension/src/contentScript.ts
git commit -m "feat(ext): normalize overrides, discover base defaults, inject google webfont link"
```

---

## Task 9: Panel hook — base state + `setBaseToken`

**Files:**
- Modify: `apps/side-panel/src/hooks/use-theme-override.ts`

- [ ] **Step 1: Implement**

Replace the entire contents of `apps/side-panel/src/hooks/use-theme-override.ts`:

```ts
import * as React from "react";
import { emptyOverride, type ThemeOverride, type ThemeMode } from "theme-core";

type DiscoverResult = {
  names: string[];
  light: Record<string, string>;
  dark: Record<string, string>;
  base: Record<string, string>;
};

type ChromeRuntime = {
  sendMessage: (message: unknown, callback?: (response: unknown) => void) => void;
  lastError?: { message?: string };
};
type ChromeApi = { runtime?: ChromeRuntime };

const chromeApi = (globalThis as { chrome?: ChromeApi }).chrome;

export function useThemeOverride() {
  const [override, setOverride] = React.useState<ThemeOverride>(emptyOverride);
  const [names, setNames] = React.useState<string[]>([]);
  const [defaults, setDefaults] = React.useState<{
    base: Record<string, string>;
    light: Record<string, string>;
    dark: Record<string, string>;
  }>({ base: {}, light: {}, dark: {} });
  const [mode, setMode] = React.useState<ThemeMode>("light");
  const [status, setStatus] = React.useState<string | null>(null);

  const flash = (m: string) => {
    setStatus(m);
    setTimeout(() => setStatus(null), 2000);
  };

  const push = React.useCallback((next: ThemeOverride) => {
    setOverride(next);
    chromeApi?.runtime?.sendMessage({ type: "set-vars", override: next });
  }, []);

  const clone = (o: ThemeOverride): ThemeOverride => ({
    base: { ...o.base },
    light: { ...o.light },
    dark: { ...o.dark },
  });

  const setToken = React.useCallback(
    (token: string, value: string) => {
      const next = clone(override);
      const bucket = next[mode];
      if (!value.trim()) delete bucket[token];
      else bucket[token] = value.trim();
      push(next);
    },
    [override, mode, push]
  );

  const setBaseToken = React.useCallback(
    (token: string, value: string) => {
      const next = clone(override);
      if (!value.trim()) delete next.base[token];
      else next.base[token] = value.trim();
      push(next);
    },
    [override, push]
  );

  const applyPreset = React.useCallback((ov: ThemeOverride) => push(ov), [push]);

  const reset = React.useCallback(() => {
    setOverride(emptyOverride());
    chromeApi?.runtime?.sendMessage({ type: "reset-vars" });
  }, []);

  const fetchDefaults = React.useCallback(() => {
    chromeApi?.runtime?.sendMessage({ type: "get-vars" }, (resp: unknown) => {
      if (chromeApi?.runtime?.lastError) {
        flash("页面未连接，请刷新 coss");
        return;
      }
      const payload = resp as { ok?: boolean; vars?: DiscoverResult };
      if (payload?.ok && payload.vars) {
        setNames(payload.vars.names);
        setDefaults({
          base: payload.vars.base ?? {},
          light: payload.vars.light,
          dark: payload.vars.dark,
        });
      }
    });
  }, []);

  React.useEffect(() => {
    fetchDefaults();
  }, [fetchDefaults]);

  return {
    override,
    names,
    defaults,
    mode,
    setMode,
    setToken,
    setBaseToken,
    applyPreset,
    reset,
    status,
    flash,
    fetchDefaults,
  };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `bun run build`
Expected: side-panel build succeeds (App not yet using setBaseToken — that's Task 12; extra return value is harmless).

- [ ] **Step 3: Commit**

```bash
git add apps/side-panel/src/hooks/use-theme-override.ts
git commit -m "feat(panel): base defaults + setBaseToken in useThemeOverride"
```

---

## Task 10: Color picker — alpha (HexAlpha) + checkerboard

**Files:**
- Modify: `apps/side-panel/src/components/color-picker.tsx`

- [ ] **Step 1: Implement**

Replace the entire contents of `apps/side-panel/src/components/color-picker.tsx`:

```tsx
import * as React from "react";
import { HexAlphaColorPicker } from "react-colorful";
import { toHex8, colorFormatter } from "theme-core";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  /** 当前生效值（覆盖值或默认值），任意颜色格式。 */
  value: string;
  /** 输出 oklch 字符串（含 alpha）。 */
  onChange: (oklch: string) => void;
}

/** 透明棋盘格，让半透明色块可辨。 */
const CHECKER =
  "repeating-conic-gradient(#bbb 0% 25%, #fff 0% 50%) 50% / 8px 8px";

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const hex8 = toHex8(value);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="选择颜色"
        className="border-border size-6 shrink-0 rounded border"
        style={{ background: CHECKER }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="block size-full rounded" style={{ backgroundColor: hex8 }} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 space-y-2 rounded-md border bg-popover p-2 shadow-md">
          <HexAlphaColorPicker color={hex8} onChange={(h) => onChange(colorFormatter(h, "oklch"))} />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `bun run build`
Expected: side-panel build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/side-panel/src/components/color-picker.tsx
git commit -m "feat(panel): alpha-capable color picker with transparency checkerboard"
```

---

## Task 11: Font select + non-color controls components

**Files:**
- Create: `apps/side-panel/src/components/font-select.tsx`
- Create: `apps/side-panel/src/components/non-color-controls.tsx`

- [ ] **Step 1: Implement font-select**

Create `apps/side-panel/src/components/font-select.tsx`:

```tsx
import { FONTS } from "theme-core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FontSelectProps {
  token: string; // "font-sans" | "font-mono"
  value: string; // 当前栈（覆盖或默认）
  onChange: (token: string, value: string) => void;
}

export function FontSelect({ token, value, onChange }: FontSelectProps) {
  const kind = token === "font-mono" ? "mono" : "sans";
  const opts = FONTS.filter((f) => f.kind === kind);
  return (
    <Select<string>
      value={value || undefined}
      onValueChange={(v) => {
        if (v) onChange(token, v);
      }}
    >
      <SelectTrigger size="sm" className="flex-1">
        <SelectValue placeholder="默认字体" />
      </SelectTrigger>
      <SelectContent>
        {opts.map((f) => (
          <SelectItem key={f.id} value={f.stack}>
            {f.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 2: Implement non-color-controls**

Create `apps/side-panel/src/components/non-color-controls.tsx`:

```tsx
import { NON_COLOR_CONTROLS } from "theme-core";
import { cn } from "@/lib/utils";
import { FontSelect } from "./font-select";

interface NonColorControlsProps {
  defaults: Record<string, string>;
  overrides: Record<string, string>;
  onChange: (token: string, value: string) => void;
}

export function NonColorControls({ defaults, overrides, onChange }: NonColorControlsProps) {
  return (
    <section className="space-y-1">
      <h2 className="text-muted-foreground px-1 text-xs font-semibold">布局 &amp; 字体</h2>
      {NON_COLOR_CONTROLS.map((c) => {
        const current = overrides[c.token] ?? defaults[c.token] ?? "";
        const changed = c.token in overrides;
        return (
          <div
            key={c.token}
            className={cn("flex items-center gap-2 rounded-md p-1.5", changed && "bg-accent")}
          >
            <span className="text-foreground w-20 shrink-0 truncate text-xs font-medium">
              {c.label}
            </span>
            {c.kind === "slider" ? (
              (() => {
                const num = parseFloat(current) || 0;
                return (
                  <>
                    <input
                      type="range"
                      min={c.min}
                      max={c.max}
                      step={c.step}
                      value={num}
                      onChange={(e) => onChange(c.token, `${e.target.value}${c.unit ?? ""}`)}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground w-16 shrink-0 text-right text-xs tabular-nums">
                      {num}
                      {c.unit}
                    </span>
                  </>
                );
              })()
            ) : (
              <FontSelect token={c.token} value={current} onChange={onChange} />
            )}
            {changed && <span className="text-primary/60 shrink-0 text-[10px]">改</span>}
          </div>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `bun run build`
Expected: side-panel build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/side-panel/src/components/font-select.tsx apps/side-panel/src/components/non-color-controls.tsx
git commit -m "feat(panel): font select + non-color (radius/spacing/font) controls"
```

---

## Task 12: Wire controls into App

**Files:**
- Modify: `apps/side-panel/src/App.tsx`

- [ ] **Step 1: Implement**

In `apps/side-panel/src/App.tsx`:

(a) Add the import near the other component imports:

```tsx
import { NonColorControls } from "@/components/non-color-controls";
```

(b) Pull `setBaseToken` from the hook — change the destructuring line:

```tsx
  const { override, names, defaults, mode, setMode, setToken, setBaseToken, applyPreset, reset, status, fetchDefaults } =
    useThemeOverride();
```

(c) Render `NonColorControls` above the color groups. Replace the `<div className="mt-5 space-y-4">…</div>` block with:

```tsx
      <div className="mt-5 space-y-4">
        <NonColorControls
          defaults={defaults.base}
          overrides={override.base}
          onChange={setBaseToken}
        />
        {groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">请先打开 coss.com/ui 页面，再点「读取当前」</p>
        ) : (
          groups.map((g) => (
            <TokenGroup
              key={g.id}
              label={g.label}
              tokens={g.tokens}
              defaults={defaults[mode]}
              overrides={override[mode]}
              onChange={setToken}
            />
          ))
        )}
      </div>
```

- [ ] **Step 2: Verify it compiles**

Run: `bun run build`
Expected: full build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/side-panel/src/App.tsx
git commit -m "feat(panel): render layout & font controls above color groups"
```

---

## Task 13: E2E update + full verification

**Files:**
- Modify: `e2e/extension.spec.ts`

- [ ] **Step 1: Update the injection E2E to cover base**

In `e2e/extension.spec.ts`, replace the `page.evaluate` injection block and the assertions in the second test (lines ~43–53) with:

```ts
  await page.evaluate(() => {
    const w = window as unknown as {
      __cossInject?: (o: {
        base: Record<string, string>;
        light: Record<string, string>;
        dark: Record<string, string>;
      }) => void;
    };
    w.__cossInject?.({
      base: { radius: "1.25rem" },
      light: { primary: "oklch(0.6 0.2 250)" },
      dark: { primary: "oklch(0.7 0.1 250)" },
    });
  });
  const styleText = await page.locator("#coss-tweak").textContent();
  expect(styleText).toContain(":root {");
  expect(styleText).toContain("--radius: 1.25rem;");
  expect(styleText).toContain("--primary: oklch(0.6 0.2 250);");
  // base 只进 :root，不进 .dark
  const darkBlock = styleText!.slice(styleText!.indexOf(".dark {"));
  expect(darkBlock).not.toContain("--radius");
  const radius = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--radius").trim()
  );
  expect(radius).toBe("1.25rem");
```

- [ ] **Step 2: Run the full automated suite**

Run:
```bash
bun run build
grep -c "import" chrome-extension/dist/contentScript.js   # expect 0
grep -c "import" chrome-extension/dist/background.js       # expect 0
ls chrome-extension/dist/assets 2>&1                       # expect: no such dir
bun run test                                               # all theme-core unit tests green
bun run test:e2e                                           # playwright green
```
Expected: build clean; both import counts `0`; no `dist/assets`; unit tests all pass; E2E 2 tests pass.

- [ ] **Step 3: Commit**

```bash
git add e2e/extension.spec.ts
git commit -m "test(e2e): assert base (radius) injected into :root only"
```

- [ ] **Step 4: Manual smoke checklist (human, not automated)**

Load unpacked (`chrome://extensions` → Load unpacked → repo root after `bun run build`), open https://coss.com/ui, open the side panel, click 读取当前, then verify:
- Drag **圆角** slider → page corner radius changes live.
- Drag **间距(全局)** slider → layout density changes live.
- Edit `secondary` (a translucent token) → it stays translucent (not solid); its swatch shows the transparency checkerboard.
- Pick a Google **界面字体** (e.g. Inter) → UI font changes after the webfont loads.
- Toggle 亮色/暗色 → radius/spacing/font persist across both modes; colors apply per mode.
- Open 导出 → base tokens (`--radius`, `--spacing`, `--font-sans`) appear in `:root`; translucent colors carry alpha (oklch `… / a`).
- Reload coss.com/ui → all overrides persist.

---

## Self-Review

**Spec coverage:**
- §2 goal 1 (alpha): Task 3 (converter) + Task 10 (picker) ✅
- §2 goal 2 (radius slider): Task 4 (config) + Task 11/12 (UI) ✅
- §2 goal 3 (spacing slider): same ✅
- §2 goal 4 (font override): Task 5 (catalog) + Task 8 (webfont link) + Task 11/12 (UI) ✅
- §2 goal 5 (base bucket + migration): Task 1 (model+normalize) + Task 2 (buildOverrideCss) + Task 8 (content normalize) ✅
- §3.5 discover base: Task 7 (contract) + Task 8 (readBaseDefaults) + Task 9 (hook) ✅
- §5 testing (unit + e2e + manual): Tasks 1–6 unit, Task 13 e2e + manual ✅
- Background "no change" (forwards opaquely, content normalizes): documented in Architecture; no task — intentional.

**Placeholder scan:** none — every code step is complete.

**Type consistency:** `ThemeOverride { base; light; dark }`, `normalizeOverride`, `toHex8`, `NON_COLOR_CONTROLS`, `googleFontHref`, `DiscoverResult.base`, `setBaseToken`, `HexAlphaColorPicker` — all defined before use and referenced consistently across tasks.
