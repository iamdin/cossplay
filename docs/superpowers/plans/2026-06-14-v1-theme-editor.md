# COSS UI Theme Tweak v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 MVP Chrome 扩展上补齐 v1：逐 token 取色器、Light/Dark 分别编辑、tweakcn 预设、导出 CSS。

**Architecture:** 沿用方案 A（原生 Side Panel + content script 注入 coss 页面）。新增共享 workspace 包 `packages/theme-core` 存纯逻辑（token schema、颜色转换、override→CSS builder、预设），被面板与扩展同时依赖，保证注入与导出共用同一个 builder、不漂移。

**Tech Stack:** bun workspaces + turbo · React 19 + Vite 7 + Tailwind v4（面板）· culori + react-colorful · Vitest + jsdom（单测）· Playwright（E2E）

参考 spec：`docs/superpowers/specs/2026-06-14-v1-theme-editor-design.md`

---

## 文件结构

```
packages/theme-core/                 # 新增：共享纯逻辑包
  package.json
  tsconfig.json
  vitest.config.ts
  src/
    index.ts                         # re-export
    types.ts                         # ThemeOverride / ThemeMode
    tokens.ts                        # TOKEN_GROUPS / COLOR_TOKENS / groupTokens()
    color-converter.ts               # 移植自 tweakcn（裁剪）
    override-css.ts                  # buildOverrideCss()（注入+导出共用）
    presets.ts                       # 移植自 tweakcn 的 25 套预设 + ThemePreset 类型
    __tests__/
      tokens.test.ts
      color-converter.test.ts
      override-css.test.ts

chrome-extension/
  manifest.json                      # 改：content script matches 扩到 /ui/*
  package.json                       # 改：加依赖 theme-core
  src/
    contentScript.ts                 # 改：<style> 双段注入 + light/dark 默认读取 + MutationObserver
    background.ts                    # 改：isTargetUrl 放宽 + 存/转发 {light,dark}
    shared/messages.ts               # 新增：消息类型

apps/side-panel/
  package.json                       # 改：加 theme-core / react-colorful / culori
  src/
    App.tsx                          # 改：编排（mode 切换、分组、动作）
    hooks/use-theme-override.ts      # 新增：覆盖状态 + 与扩展通信
    components/
      color-picker.tsx               # 新增：react-colorful 弹层 + hex 输入
      token-row.tsx                  # 新增：单 token 行
      token-group.tsx                # 新增：分组
      preset-select.tsx              # 新增：预设下拉
      export-dialog.tsx              # 新增：导出 CSS

e2e/                                 # 新增：Playwright
  playwright.config.ts
  fixtures/coss-mock.html
  extension.spec.ts

playwright.config.ts / package.json  # 根：加 @playwright/test + test:e2e
```

**Canonical token key 约定**：theme-core 内部 token key **不带 `--` 前缀**（如 `primary`、`sidebar-ring`），与 tweakcn 预设一致。content script 读取/注入时负责加减 `--`。

---

## Phase 0：共享包脚手架

### Task 1: 创建 `packages/theme-core` 工作区包

**Files:**
- Create: `packages/theme-core/package.json`
- Create: `packages/theme-core/tsconfig.json`
- Create: `packages/theme-core/src/index.ts`
- Modify: `package.json`（根，加 `packages/*` 到 workspaces）

- [ ] **Step 1: 写包 manifest**

`packages/theme-core/package.json`:
```json
{
  "name": "theme-core",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "echo \"(no lint)\""
  },
  "dependencies": {
    "culori": "^4.0.1"
  },
  "devDependencies": {
    "@types/culori": "^4.0.0",
    "typescript": "~5.9.3",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: 写 tsconfig**

`packages/theme-core/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"],
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 占位 index**

`packages/theme-core/src/index.ts`:
```ts
export {};
```

- [ ] **Step 4: 根 workspaces 加 `packages/*`**

`package.json`（根）把 `workspaces` 改为：
```json
  "workspaces": [
    "apps/*",
    "packages/*",
    "chrome-extension"
  ],
```
并在 `scripts` 增加：
```json
    "test": "bun run --filter '*' test",
```

- [ ] **Step 5: 安装并验证**

Run: `bun install`
Expected: 安装成功，`node_modules/theme-core` 软链到 `packages/theme-core`。

- [ ] **Step 6: Commit**

```bash
git add packages/theme-core package.json
git commit -m "chore: scaffold theme-core shared workspace package"
```

---

### Task 2: 配置 Vitest

**Files:**
- Create: `packages/theme-core/vitest.config.ts`
- Create: `packages/theme-core/src/__tests__/smoke.test.ts`

- [ ] **Step 1: vitest 配置**

`packages/theme-core/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

加 jsdom 到 devDeps：
Run: `bun add -d --cwd packages/theme-core jsdom`

- [ ] **Step 2: 冒烟测试**

`packages/theme-core/src/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 3: 跑测试**

Run: `bun run --cwd packages/theme-core test`
Expected: PASS（1 passed）。

- [ ] **Step 4: Commit**

```bash
git add packages/theme-core
git commit -m "test: configure vitest for theme-core"
```

---

## Phase 1：theme-core 纯逻辑（TDD）

### Task 3: token schema 与分组

**Files:**
- Create: `packages/theme-core/src/types.ts`
- Create: `packages/theme-core/src/tokens.ts`
- Test: `packages/theme-core/src/__tests__/tokens.test.ts`

- [ ] **Step 1: 写类型**

`packages/theme-core/src/types.ts`:
```ts
export type ThemeMode = "light" | "dark";

/** token key 不带 `--` 前缀，如 "primary"、"sidebar-ring"。 */
export interface ThemeOverride {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export const emptyOverride = (): ThemeOverride => ({ light: {}, dark: {} });
```

- [ ] **Step 2: 写失败的测试**

`packages/theme-core/src/__tests__/tokens.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { groupTokens, COLOR_TOKENS, TOKEN_GROUPS } from "../tokens";

describe("groupTokens", () => {
  it("places known tokens into their group", () => {
    const groups = groupTokens(["primary", "sidebar-ring", "chart-2"]);
    const byId = Object.fromEntries(groups.map((g) => [g.id, g.tokens]));
    expect(byId["primary"]).toContain("primary");
    expect(byId["sidebar"]).toContain("sidebar-ring");
    expect(byId["chart"]).toContain("chart-2");
  });

  it("puts unknown tokens into the 'other' group", () => {
    const groups = groupTokens(["xyz-unknown"]);
    const other = groups.find((g) => g.id === "other");
    expect(other?.tokens).toEqual(["xyz-unknown"]);
  });

  it("omits empty groups and keeps group order stable", () => {
    const groups = groupTokens(["primary", "background"]);
    expect(groups.map((g) => g.id)).toEqual(["base", "primary"]);
  });

  it("COLOR_TOKENS contains coss extras", () => {
    for (const t of ["info", "success", "warning", "code", "code-highlight"]) {
      expect(COLOR_TOKENS.has(t)).toBe(true);
    }
    expect(TOKEN_GROUPS.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: 跑测试确认失败**

Run: `bun run --cwd packages/theme-core test`
Expected: FAIL（Cannot find module "../tokens"）。

- [ ] **Step 4: 实现**

`packages/theme-core/src/tokens.ts`:
```ts
export interface TokenGroupDef {
  id: string;
  label: string;
  tokens: string[];
}

/** 分组定义（顺序即显示顺序）。token key 不带 `--`。 */
export const TOKEN_GROUP_DEFS: TokenGroupDef[] = [
  {
    id: "base",
    label: "基础",
    tokens: [
      "background", "foreground", "card", "card-foreground",
      "popover", "popover-foreground",
    ],
  },
  {
    id: "primary",
    label: "主色",
    tokens: [
      "primary", "primary-foreground", "secondary", "secondary-foreground",
      "accent", "accent-foreground", "muted", "muted-foreground",
    ],
  },
  {
    id: "semantic",
    label: "语义",
    tokens: [
      "destructive", "destructive-foreground",
      "info", "info-foreground",
      "success", "success-foreground",
      "warning", "warning-foreground",
    ],
  },
  {
    id: "form",
    label: "边框/输入",
    tokens: ["border", "input", "ring"],
  },
  {
    id: "chart",
    label: "图表",
    tokens: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
  },
  {
    id: "sidebar",
    label: "侧边栏",
    tokens: [
      "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
      "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
    ],
  },
  {
    id: "code",
    label: "代码",
    tokens: ["code", "code-foreground", "code-highlight"],
  },
];

export const COLOR_TOKENS: Set<string> = new Set(
  TOKEN_GROUP_DEFS.flatMap((g) => g.tokens)
);

export const TOKEN_GROUPS = TOKEN_GROUP_DEFS;

const tokenToGroupId = new Map<string, string>();
for (const g of TOKEN_GROUP_DEFS) {
  for (const t of g.tokens) tokenToGroupId.set(t, g.id);
}

export interface GroupedTokens {
  id: string;
  label: string;
  tokens: string[];
}

/** 把发现的 token 名按分组归类；未知归入 "other"；空组省略。 */
export function groupTokens(names: string[]): GroupedTokens[] {
  const buckets = new Map<string, string[]>();
  const unknown: string[] = [];

  for (const name of names) {
    const gid = tokenToGroupId.get(name);
    if (!gid) {
      unknown.push(name);
      continue;
    }
    if (!buckets.has(gid)) buckets.set(gid, []);
    buckets.get(gid)!.push(name);
  }

  const result: GroupedTokens[] = [];
  for (const g of TOKEN_GROUP_DEFS) {
    const tokens = buckets.get(g.id);
    if (tokens && tokens.length) {
      result.push({ id: g.id, label: g.label, tokens });
    }
  }
  if (unknown.length) {
    result.push({ id: "other", label: "其它", tokens: unknown });
  }
  return result;
}
```

- [ ] **Step 5: 跑测试确认通过**

Run: `bun run --cwd packages/theme-core test`
Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add packages/theme-core/src
git commit -m "feat(theme-core): token schema and grouping"
```

---

### Task 4: 颜色转换（移植 + 测试）

**Files:**
- Create: `packages/theme-core/src/color-converter.ts`
- Test: `packages/theme-core/src/__tests__/color-converter.test.ts`

- [ ] **Step 1: 写失败的测试**

`packages/theme-core/src/__tests__/color-converter.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { colorFormatter, toHex } from "../color-converter";

describe("colorFormatter", () => {
  it("converts hex to oklch string", () => {
    const out = colorFormatter("#ffffff", "oklch");
    expect(out.startsWith("oklch(")).toBe(true);
  });

  it("round-trips hex -> oklch -> hex within tolerance", () => {
    const oklch = colorFormatter("#3b82f6", "oklch");
    const back = toHex(oklch);
    expect(back.toLowerCase()).toBe("#3b82f6");
  });

  it("returns input unchanged on invalid color", () => {
    expect(colorFormatter("not-a-color", "oklch")).toBe("not-a-color");
  });
});

describe("toHex", () => {
  it("parses oklch to hex", () => {
    expect(toHex("oklch(1 0 0)").toLowerCase()).toBe("#ffffff");
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `bun run --cwd packages/theme-core test color-converter`
Expected: FAIL（Cannot find module "../color-converter"）。

- [ ] **Step 3: 实现（裁剪自 tweakcn，去掉外部类型依赖）**

`packages/theme-core/src/color-converter.ts`:
```ts
import * as culori from "culori";

export type ColorFormat = "hsl" | "rgb" | "oklch" | "hex";

export const formatNumber = (num?: number) => {
  if (!num) return "0";
  return num % 1 === 0 ? num : Number(num.toFixed(4));
};

export const colorFormatter = (
  colorValue: string,
  format: ColorFormat = "oklch"
): string => {
  try {
    const color = culori.parse(colorValue);
    if (!color) throw new Error("Invalid color input");

    switch (format) {
      case "hsl": {
        const hsl = culori.converter("hsl")(color);
        return `hsl(${formatNumber(hsl.h)} ${formatNumber((hsl.s ?? 0) * 100)}% ${formatNumber((hsl.l ?? 0) * 100)}%)`;
      }
      case "rgb":
        return culori.formatRgb(color);
      case "oklch": {
        const oklch = culori.converter("oklch")(color);
        return `oklch(${formatNumber(oklch.l)} ${formatNumber(oklch.c)} ${formatNumber(oklch.h)})`;
      }
      case "hex":
        return culori.formatHex(color);
      default:
        return colorValue;
    }
  } catch (error) {
    console.error(`Failed to convert color: ${colorValue}`, error);
    return colorValue;
  }
};

/** 解析任意颜色为 #rrggbb；失败回退原值。供取色器显示用。 */
export const toHex = (colorValue: string): string => {
  const parsed = culori.parse(colorValue);
  if (!parsed) return colorValue;
  return culori.formatHex(parsed);
};
```

- [ ] **Step 4: 跑测试确认通过**

Run: `bun run --cwd packages/theme-core test color-converter`
Expected: PASS。

> 注：`toHex` 把 oklch 经 sRGB hex 显示，广色域会被裁剪——v1 接受（取色器只在 hex 空间操作）。

- [ ] **Step 5: Commit**

```bash
git add packages/theme-core/src
git commit -m "feat(theme-core): port color converter from tweakcn"
```

---

### Task 5: override → CSS builder（注入与导出共用）

**Files:**
- Create: `packages/theme-core/src/override-css.ts`
- Test: `packages/theme-core/src/__tests__/override-css.test.ts`

- [ ] **Step 1: 写失败的测试**

`packages/theme-core/src/__tests__/override-css.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildOverrideCss, exportCss } from "../override-css";

describe("buildOverrideCss", () => {
  it("emits :root and .dark blocks from changed tokens", () => {
    const css = buildOverrideCss({
      light: { primary: "oklch(0.5 0 0)" },
      dark: { primary: "oklch(0.8 0 0)" },
    });
    expect(css).toBe(
      ":root {\n  --primary: oklch(0.5 0 0);\n}\n\n.dark {\n  --primary: oklch(0.8 0 0);\n}"
    );
  });

  it("omits .dark block when no dark changes", () => {
    const css = buildOverrideCss({ light: { primary: "red" }, dark: {} });
    expect(css).toBe(":root {\n  --primary: red;\n}");
  });

  it("returns empty string for no changes", () => {
    expect(buildOverrideCss({ light: {}, dark: {} })).toBe("");
  });

  it("skips blank values", () => {
    expect(buildOverrideCss({ light: { primary: "  " }, dark: {} })).toBe("");
  });
});

describe("exportCss", () => {
  it("formats values to oklch", () => {
    const css = exportCss({ light: { primary: "#ffffff" }, dark: {} }, "oklch");
    expect(css).toContain("--primary: oklch(");
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `bun run --cwd packages/theme-core test override-css`
Expected: FAIL。

- [ ] **Step 3: 实现**

`packages/theme-core/src/override-css.ts`:
```ts
import type { ThemeOverride } from "./types";
import { colorFormatter, type ColorFormat } from "./color-converter";

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

/** 导出：把值统一格式化（默认 oklch）。 */
export function exportCss(
  override: ThemeOverride,
  format: ColorFormat = "oklch"
): string {
  return buildOverrideCss(override, (v) => colorFormatter(v, format));
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `bun run --cwd packages/theme-core test override-css`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add packages/theme-core/src
git commit -m "feat(theme-core): shared override-to-css builder"
```

---

### Task 6: 移植 tweakcn 预设

**Files:**
- Create: `packages/theme-core/src/presets.ts`（从 tweakcn 复制 + 改类型导入）
- Modify: `packages/theme-core/src/index.ts`

- [ ] **Step 1: 复制预设数据文件**

Run（从本机 tweakcn 复制；MIT 协议）:
```bash
cp /Users/dinq/GitHub/jnsahaj/tweakcn/utils/theme-presets.ts \
   packages/theme-core/src/presets.ts
```

- [ ] **Step 2: 改首行类型导入为本地最小类型**

把 `packages/theme-core/src/presets.ts` 第 1 行
```ts
import { ThemePreset } from "../types/theme";
```
替换为：
```ts
export type ThemePreset = {
  source?: "SAVED" | "BUILT_IN";
  createdAt?: string;
  label?: string;
  styles: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
};
```

- [ ] **Step 3: 汇总导出**

`packages/theme-core/src/index.ts`:
```ts
export * from "./types";
export * from "./tokens";
export * from "./color-converter";
export * from "./override-css";
export * from "./presets";
```

- [ ] **Step 4: 加预设过滤工具 + 测试**

`packages/theme-core/src/presets.ts` 末尾追加：
```ts
import { COLOR_TOKENS } from "./tokens";
import type { ThemeOverride } from "./types";

/** 把预设取色键裁剪到我们管理的颜色 token，转成 ThemeOverride。 */
export function presetToOverride(preset: ThemePreset): ThemeOverride {
  const pick = (styles: Record<string, string>): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(styles)) {
      if (COLOR_TOKENS.has(k) && typeof v === "string") out[k] = v;
    }
    return out;
  };
  return { light: pick(preset.styles.light), dark: pick(preset.styles.dark) };
}
```

`packages/theme-core/src/__tests__/presets.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { defaultPresets, presetToOverride } from "../presets";
import { COLOR_TOKENS } from "../tokens";

describe("presets", () => {
  it("loads built-in presets", () => {
    expect(Object.keys(defaultPresets).length).toBeGreaterThan(10);
    expect(defaultPresets["modern-minimal"]).toBeTruthy();
  });

  it("presetToOverride keeps only color tokens", () => {
    const ov = presetToOverride(defaultPresets["modern-minimal"]);
    for (const k of Object.keys(ov.light)) {
      expect(COLOR_TOKENS.has(k)).toBe(true);
    }
    expect(ov.light.primary).toBeTruthy();
  });
});
```

- [ ] **Step 5: 跑全部测试**

Run: `bun run --cwd packages/theme-core test`
Expected: PASS（全部 5 个测试文件）。

- [ ] **Step 6: Commit**

```bash
git add packages/theme-core/src
git commit -m "feat(theme-core): port tweakcn presets and override mapper"
```

---

## Phase 2：扩展层（content script + background）

### Task 7: 消息类型与 manifest 范围

**Files:**
- Create: `chrome-extension/src/shared/messages.ts`
- Modify: `chrome-extension/manifest.json`
- Modify: `chrome-extension/package.json`

- [ ] **Step 1: 加 theme-core 依赖**

`chrome-extension/package.json` 的 `devDependencies`（content script 会被打包进单文件，依赖按 dev 即可）加：
```json
    "theme-core": "workspace:*",
```
Run: `bun install`

- [ ] **Step 2: 消息类型**

`chrome-extension/src/shared/messages.ts`:
```ts
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
```

- [ ] **Step 3: manifest 扩范围**

`chrome-extension/manifest.json` 的 `content_scripts[0].matches` 改为：
```json
      "matches": [
        "https://coss.com/ui",
        "https://coss.com/ui/*"
      ],
```

- [ ] **Step 4: 构建验证**

Run: `bun run --cwd chrome-extension build`
Expected: 成功（暂未用到新类型也应编译通过）。

- [ ] **Step 5: Commit**

```bash
git add chrome-extension
git commit -m "feat(ext): message types and broaden content-script scope to /ui/*"
```

---

### Task 8: content script —— `<style>` 双段注入 + light/dark 默认读取

**Files:**
- Modify: `chrome-extension/src/contentScript.ts`（整体重写）

- [ ] **Step 1: 整体重写 contentScript**

`chrome-extension/src/contentScript.ts`:
```ts
import { buildOverrideCss, type ThemeOverride } from "theme-core";
import { STORAGE_KEY, type BgToContent, type DiscoverResult } from "./shared/messages";

const STYLE_ID = "coss-tweak";

const emptyOverride = (): ThemeOverride => ({ light: {}, dark: {} });

/** 注入/更新覆盖样式：写 :root{} + .dark{} 两段，追加到 <head> 末尾。 */
const injectOverride = (override: ThemeOverride) => {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
  }
  el.textContent = buildOverrideCss(override);
  document.head.appendChild(el); // 保证在最后，源顺序取胜
};

const removeOverride = () => {
  document.getElementById(STYLE_ID)?.remove();
};

const loadStored = () => {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const stored = result[STORAGE_KEY] as ThemeOverride | undefined;
    if (stored) injectOverride(stored);
  });
};

/** 被框架移除时重新注入。 */
const guardStyle = () => {
  const observer = new MutationObserver(() => {
    if (!document.getElementById(STYLE_ID)) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const stored = result[STORAGE_KEY] as ThemeOverride | undefined;
        if (stored && buildOverrideCss(stored)) injectOverride(stored);
      });
    }
  });
  observer.observe(document.head, { childList: true });
};

/** 收集所有 coss 颜色 token 名（来自样式表 :root/.dark 规则，不带 `--`）。 */
const collectTokenNames = (): string[] => {
  const set = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // 跨域样式表
    }
    for (const rule of Array.from(rules)) {
      if (
        rule instanceof CSSStyleRule &&
        (rule.selectorText === ":root" || rule.selectorText === ".dark")
      ) {
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          if (prop.startsWith("--")) set.add(prop.slice(2));
        }
      }
    }
  }
  return Array.from(set).sort();
};

/** 读某模式下每个 token 的解析色值（#hex），通过临时元素让 var() resolve。 */
const readResolved = (names: string[]): Record<string, string> => {
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.opacity = "0";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);
  const out: Record<string, string> = {};
  for (const name of names) {
    probe.style.color = `var(--${name})`;
    const resolved = getComputedStyle(probe).color; // rgb(...)
    if (resolved) out[name] = resolved;
  }
  probe.remove();
  return out;
};

/** 读 light + dark 两套默认值；临时移除注入样式与切换 .dark 以取原始值。 */
const discover = (): DiscoverResult => {
  const names = collectTokenNames();
  const root = document.documentElement;

  const hadOverride = !!document.getElementById(STYLE_ID);
  removeOverride();
  const wasDark = root.classList.contains("dark");

  // light
  root.classList.remove("dark");
  const light = readResolved(names);
  // dark
  root.classList.add("dark");
  const dark = readResolved(names);

  // 还原
  if (wasDark) root.classList.add("dark");
  else root.classList.remove("dark");
  if (hadOverride) loadStored();

  return { names, light, dark };
};

chrome.runtime.onMessage.addListener((message: BgToContent, _sender, sendResponse) => {
  if (message?.type === "apply-vars") {
    injectOverride(message.override ?? emptyOverride());
    sendResponse({ ok: true });
    return true;
  }
  if (message?.type === "reset-vars") {
    removeOverride();
    sendResponse({ ok: true });
    return true;
  }
  if (message?.type === "get-vars") {
    const run = () => sendResponse({ ok: true, vars: discover() });
    if (document.readyState === "complete") run();
    else window.addEventListener("load", run, { once: true });
    return true;
  }
  return false;
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { loadStored(); guardStyle(); }, { once: true });
} else {
  loadStored();
  guardStyle();
}
```

- [ ] **Step 2: 构建验证**

Run: `bun run --cwd chrome-extension build`
Expected: `dist/contentScript.js` 产出，且为自包含单文件（theme-core 被打包进去，无残留 `import`）。

- [ ] **Step 3: 人工确认产物无外部 import**

Run: `grep -c "^import" chrome-extension/dist/contentScript.js`
Expected: `0`（依赖已内联）。

- [ ] **Step 4: Commit**

```bash
git add chrome-extension/src/contentScript.ts
git commit -m "feat(ext): inject :root/.dark override style + read light/dark defaults"
```

---

### Task 9: background —— 范围放宽 + `{light,dark}` 存转

**Files:**
- Modify: `chrome-extension/src/background.ts`（整体重写）

- [ ] **Step 1: 整体重写 background**

`chrome-extension/src/background.ts`:
```ts
import type { ThemeOverride } from "theme-core";
import { STORAGE_KEY, type PanelToBg } from "./shared/messages";

const isTargetUrl = (url?: string) =>
  typeof url === "string" && url.startsWith("https://coss.com/ui");

const sendToActiveTab = async (payload: unknown) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !isTargetUrl(tab.url)) return;
  chrome.tabs.sendMessage(tab.id, payload);
};

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) chrome.sidePanel.open({ tabId: tab.id });
});
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onMessage.addListener((message: PanelToBg, _sender, sendResponse) => {
  if (message?.type === "set-vars") {
    const override = message.override as ThemeOverride;
    chrome.storage.local.set({ [STORAGE_KEY]: override }, () => {
      sendToActiveTab({ type: "apply-vars", override });
      sendResponse({ ok: true });
    });
    return true;
  }
  if (message?.type === "reset-vars") {
    chrome.storage.local.remove([STORAGE_KEY], () => {
      sendToActiveTab({ type: "reset-vars" });
      sendResponse({ ok: true });
    });
    return true;
  }
  if (message?.type === "reload-target") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id || !isTargetUrl(tab.url)) {
        sendResponse({ ok: false, error: "未找到目标页面" });
        return;
      }
      chrome.tabs.reload(tab.id, {}, () => sendResponse({ ok: true }));
    });
    return true;
  }
  if (message?.type === "get-vars") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id || !isTargetUrl(tab.url)) {
        sendResponse({ ok: false, error: "未找到目标页面" });
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: "get-vars" }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse(response ?? { ok: false, error: "无返回数据" });
      });
    });
    return true;
  }
  return false;
});

const reapply = (tabId: number) => {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const override = result[STORAGE_KEY] as ThemeOverride | undefined;
    if (override) chrome.tabs.sendMessage(tabId, { type: "apply-vars", override });
  });
};

chrome.tabs.onActivated.addListener(({ tabId }) => reapply(tabId));
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && isTargetUrl(tab.url)) reapply(tabId);
});
```

- [ ] **Step 2: 构建验证**

Run: `bun run --cwd chrome-extension build`
Expected: 成功，`dist/background.js` 产出。

- [ ] **Step 3: Commit**

```bash
git add chrome-extension/src/background.ts
git commit -m "feat(ext): store/forward {light,dark} override, broaden target url"
```

---

## Phase 3：面板 UI

### Task 10: 安装依赖 + 覆盖状态 hook

**Files:**
- Modify: `apps/side-panel/package.json`
- Create: `apps/side-panel/src/hooks/use-theme-override.ts`

- [ ] **Step 1: 加依赖**

Run:
```bash
bun add --cwd apps/side-panel theme-core@workspace:* react-colorful culori
bun add -d --cwd apps/side-panel @types/culori
```

- [ ] **Step 2: 写状态 hook**

`apps/side-panel/src/hooks/use-theme-override.ts`:
```ts
import * as React from "react";
import { emptyOverride, type ThemeOverride, type ThemeMode } from "theme-core";

type DiscoverResult = { names: string[]; light: Record<string, string>; dark: Record<string, string> };
const chromeApi = (globalThis as { chrome?: typeof chrome }).chrome;

export function useThemeOverride() {
  const [override, setOverride] = React.useState<ThemeOverride>(emptyOverride);
  const [names, setNames] = React.useState<string[]>([]);
  const [defaults, setDefaults] = React.useState<{ light: Record<string, string>; dark: Record<string, string> }>({ light: {}, dark: {} });
  const [mode, setMode] = React.useState<ThemeMode>("light");
  const [status, setStatus] = React.useState<string | null>(null);

  const flash = (m: string) => { setStatus(m); setTimeout(() => setStatus(null), 2000); };

  const push = React.useCallback((next: ThemeOverride) => {
    setOverride(next);
    chromeApi?.runtime?.sendMessage({ type: "set-vars", override: next });
  }, []);

  const setToken = React.useCallback((token: string, value: string) => {
    setOverride((prev) => {
      const next: ThemeOverride = { light: { ...prev.light }, dark: { ...prev.dark } };
      const bucket = next[mode];
      if (!value.trim()) delete bucket[token];
      else bucket[token] = value.trim();
      chromeApi?.runtime?.sendMessage({ type: "set-vars", override: next });
      return next;
    });
  }, [mode]);

  const applyPreset = React.useCallback((ov: ThemeOverride) => push(ov), [push]);

  const reset = React.useCallback(() => {
    setOverride(emptyOverride());
    chromeApi?.runtime?.sendMessage({ type: "reset-vars" });
  }, []);

  const fetchDefaults = React.useCallback(() => {
    chromeApi?.runtime?.sendMessage({ type: "get-vars" }, (resp: unknown) => {
      if (chromeApi?.runtime?.lastError) { flash("页面未连接，请刷新 coss"); return; }
      const payload = resp as { ok?: boolean; vars?: DiscoverResult };
      if (payload?.ok && payload.vars) {
        setNames(payload.vars.names);
        setDefaults({ light: payload.vars.light, dark: payload.vars.dark });
      }
    });
  }, []);

  React.useEffect(() => { fetchDefaults(); }, [fetchDefaults]);

  return { override, names, defaults, mode, setMode, setToken, applyPreset, reset, status, flash, fetchDefaults };
}
```

- [ ] **Step 3: 构建验证**

Run: `bun run --cwd apps/side-panel build`
Expected: 成功（hook 暂未被引用也应通过 tsc）。

- [ ] **Step 4: Commit**

```bash
git add apps/side-panel/package.json apps/side-panel/src/hooks
git commit -m "feat(panel): theme override state hook"
```

---

### Task 11: ColorPicker 组件

**Files:**
- Create: `apps/side-panel/src/components/color-picker.tsx`

- [ ] **Step 1: 写组件**

`apps/side-panel/src/components/color-picker.tsx`:
```tsx
import * as React from "react";
import { HexColorPicker } from "react-colorful";
import { toHex, colorFormatter } from "theme-core";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  /** 当前生效值（覆盖值或默认值），任意颜色格式。 */
  value: string;
  /** 输出 oklch 字符串。 */
  onChange: (oklch: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const hex = toHex(value);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="选择颜色"
        className="border-border size-6 shrink-0 rounded border"
        style={{ backgroundColor: hex }}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div className="absolute z-50 mt-1 space-y-2 rounded-md border bg-popover p-2 shadow-md">
          <HexColorPicker color={hex} onChange={(h) => onChange(colorFormatter(h, "oklch"))} />
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

- [ ] **Step 2: 构建验证**

Run: `bun run --cwd apps/side-panel build`
Expected: 成功。

- [ ] **Step 3: Commit**

```bash
git add apps/side-panel/src/components/color-picker.tsx
git commit -m "feat(panel): color picker component"
```

---

### Task 12: TokenRow + TokenGroup

**Files:**
- Create: `apps/side-panel/src/components/token-row.tsx`
- Create: `apps/side-panel/src/components/token-group.tsx`

- [ ] **Step 1: TokenRow**

`apps/side-panel/src/components/token-row.tsx`:
```tsx
import { ColorPicker } from "./color-picker";

interface TokenRowProps {
  token: string;
  /** 该模式默认色值（#hex）。 */
  defaultValue?: string;
  /** 当前覆盖值（无则未改）。 */
  overrideValue?: string;
  onChange: (token: string, oklch: string) => void;
}

export function TokenRow({ token, defaultValue, overrideValue, onChange }: TokenRowProps) {
  const current = overrideValue ?? defaultValue ?? "";
  const changed = !!overrideValue;
  return (
    <div className={`flex items-center gap-2 rounded-md p-1.5 ${changed ? "bg-accent" : ""}`}>
      <ColorPicker value={current} onChange={(v) => onChange(token, v)} />
      <span className="text-foreground flex-1 truncate text-xs font-medium">--{token}</span>
      {changed && <span className="text-primary/60 text-[10px]">改</span>}
    </div>
  );
}
```

- [ ] **Step 2: TokenGroup**

`apps/side-panel/src/components/token-group.tsx`:
```tsx
import { TokenRow } from "./token-row";

interface TokenGroupProps {
  label: string;
  tokens: string[];
  defaults: Record<string, string>;
  overrides: Record<string, string>;
  onChange: (token: string, oklch: string) => void;
}

export function TokenGroup({ label, tokens, defaults, overrides, onChange }: TokenGroupProps) {
  return (
    <section className="space-y-1">
      <h2 className="text-muted-foreground px-1 text-xs font-semibold">{label}</h2>
      {tokens.map((t) => (
        <TokenRow
          key={t}
          token={t}
          defaultValue={defaults[t]}
          overrideValue={overrides[t]}
          onChange={onChange}
        />
      ))}
    </section>
  );
}
```

- [ ] **Step 3: 构建验证**

Run: `bun run --cwd apps/side-panel build`
Expected: 成功。

- [ ] **Step 4: Commit**

```bash
git add apps/side-panel/src/components/token-row.tsx apps/side-panel/src/components/token-group.tsx
git commit -m "feat(panel): token row and group components"
```

---

### Task 13: PresetSelect + ExportDialog

**Files:**
- Create: `apps/side-panel/src/components/preset-select.tsx`
- Create: `apps/side-panel/src/components/export-dialog.tsx`

- [ ] **Step 1: PresetSelect**

`apps/side-panel/src/components/preset-select.tsx`:
```tsx
import { defaultPresets, presetToOverride, type ThemeOverride } from "theme-core";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface PresetSelectProps {
  onApply: (override: ThemeOverride) => void;
}

export function PresetSelect({ onApply }: PresetSelectProps) {
  const entries = Object.entries(defaultPresets);
  return (
    <Select onValueChange={(name) => onApply(presetToOverride(defaultPresets[name]))}>
      <SelectTrigger size="sm" className="w-[160px]">
        <SelectValue placeholder="预设主题" />
      </SelectTrigger>
      <SelectContent>
        {entries.map(([name, preset]) => (
          <SelectItem key={name} value={name}>
            {preset.label ?? name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

> 若 `@/components/ui/select` 的 `SelectTrigger` 不支持 `size` 属性，去掉该属性即可（以现有组件 API 为准）。

- [ ] **Step 2: ExportDialog**

`apps/side-panel/src/components/export-dialog.tsx`:
```tsx
import * as React from "react";
import { exportCss, type ThemeOverride } from "theme-core";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogContent, AlertDialogTrigger,
  AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ExportDialogProps {
  override: ThemeOverride;
}

export function ExportDialog({ override }: ExportDialogProps) {
  const css = React.useMemo(() => exportCss(override, "oklch"), [override]);
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="secondary">导出 CSS</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>导出 CSS（仅改动的 token）</AlertDialogTitle>
        </AlertDialogHeader>
        <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 text-xs">
          {css || "/* 暂无改动 */"}
        </pre>
        <AlertDialogFooter>
          <Button size="sm" onClick={copy} disabled={!css}>
            {copied ? "已复制" : "复制"}
          </Button>
          <AlertDialogCancel>关闭</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

> 以 `apps/side-panel/src/components/ui/alert-dialog.tsx` 实际导出的子组件名为准；缺哪个就用现有等价件替换。

- [ ] **Step 3: 构建验证**

Run: `bun run --cwd apps/side-panel build`
Expected: 成功。

- [ ] **Step 4: Commit**

```bash
git add apps/side-panel/src/components/preset-select.tsx apps/side-panel/src/components/export-dialog.tsx
git commit -m "feat(panel): preset select and export dialog"
```

---

### Task 14: 组装 App.tsx

**Files:**
- Modify: `apps/side-panel/src/App.tsx`（整体重写）

- [ ] **Step 1: 重写 App**

`apps/side-panel/src/App.tsx`:
```tsx
import { groupTokens, type ThemeMode } from "theme-core";
import { Button } from "@/components/ui/button";
import { useThemeOverride } from "@/hooks/use-theme-override";
import { TokenGroup } from "@/components/token-group";
import { PresetSelect } from "@/components/preset-select";
import { ExportDialog } from "@/components/export-dialog";

const chromeApi = (globalThis as { chrome?: typeof chrome }).chrome;

export function App() {
  const { override, names, defaults, mode, setMode, setToken, applyPreset, reset, status, fetchDefaults } =
    useThemeOverride();

  const groups = groupTokens(names);
  const switchMode = (m: ThemeMode) => {
    setMode(m);
    // 让 coss 切到对应模式，预览所见即所得
    chromeApi?.tabs?.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chromeApi.scripting?.executeScript({
          target: { tabId: tab.id },
          func: (dark: boolean) => document.documentElement.classList.toggle("dark", dark),
          args: [m === "dark"],
        });
      }
    });
  };

  return (
    <div className="bg-background text-foreground min-h-screen p-4">
      <header className="space-y-1">
        <h1 className="text-base font-semibold">COSS 主题调色</h1>
        <p className="text-muted-foreground text-sm">仅对 coss.com/ui 生效</p>
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-md border">
          {(["light", "dark"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-3 py-1 text-xs ${mode === m ? "bg-primary text-primary-foreground" : ""}`}
            >
              {m === "light" ? "亮色" : "暗色"}
            </button>
          ))}
        </div>
        <PresetSelect onApply={applyPreset} />
        <ExportDialog override={override} />
        <Button size="sm" variant="outline" onClick={reset}>重置</Button>
        <Button size="sm" variant="outline" onClick={fetchDefaults}>读取当前</Button>
        {status && <span className="text-muted-foreground text-xs">{status}</span>}
      </div>

      <div className="mt-5 space-y-4">
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
    </div>
  );
}

export default App;
```

- [ ] **Step 2: 加 scripting 权限**

`chrome-extension/manifest.json` 的 `permissions` 加 `"scripting"`：
```json
  "permissions": ["sidePanel", "storage", "tabs", "scripting"],
```

- [ ] **Step 3: 构建验证**

Run: `bun run build`
Expected: 全 workspace 构建成功。

- [ ] **Step 4: Commit**

```bash
git add apps/side-panel/src/App.tsx chrome-extension/manifest.json
git commit -m "feat(panel): assemble app with mode toggle, groups, presets, export"
```

---

## Phase 4：自动化 E2E

### Task 15: Playwright + 本地 fixture

**Files:**
- Modify: `package.json`（根）
- Create: `playwright.config.ts`
- Create: `e2e/fixtures/coss-mock.html`
- Create: `e2e/extension.spec.ts`

- [ ] **Step 1: 装 Playwright**

Run:
```bash
bun add -d @playwright/test
bunx playwright install chromium
```

- [ ] **Step 2: 根脚本**

`package.json`（根）`scripts` 加：
```json
    "test:e2e": "playwright test",
```

- [ ] **Step 3: Playwright 配置**

`playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
});
```

- [ ] **Step 4: fixture 页（复刻 coss token 结构）**

`e2e/fixtures/coss-mock.html`:
```html
<!doctype html>
<html class="light">
  <head>
    <meta charset="utf-8" />
    <style>
      :root { --primary: oklch(0.205 0 0); --background: #ffffff; }
      .dark { --primary: oklch(0.87 0 0); --background: oklch(0.145 0 0); }
      .swatch { color: var(--primary); background: var(--background); }
    </style>
  </head>
  <body>
    <div class="swatch" id="swatch">coss mock</div>
  </body>
</html>
```

- [ ] **Step 5: E2E 规约**

`e2e/extension.spec.ts`:
```ts
import { test, expect, chromium, type BrowserContext } from "@playwright/test";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const extPath = path.resolve(__dirname, "../chrome-extension");

let ctx: BrowserContext;
let extId: string;

test.beforeAll(async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "coss-ext-"));
  ctx = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
    ],
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent("serviceworker");
  extId = sw.url().split("/")[2];
});

test.afterAll(async () => { await ctx?.close(); });

test("content script injects :root/.dark override on a page", async () => {
  const page = await ctx.newPage();
  await page.goto("file://" + path.resolve(__dirname, "fixtures/coss-mock.html"));
  // 注入 content script（fixture 不在 manifest matches 内，手动注入）
  await page.addScriptTag({ path: path.resolve(extPath, "dist/contentScript.js") });

  // 模拟 background 下发覆盖
  await page.evaluate(() => {
    window.dispatchEvent(new MessageEvent("message"));
  });
  await page.evaluate(() => {
    // @ts-expect-error 测试环境注入
    chrome.runtime.onMessage.dispatch?.({ type: "apply-vars", override: { light: { primary: "oklch(0.6 0.2 250)" }, dark: {} } }, {}, () => {});
  });

  const styleText = await page.locator("#coss-tweak").textContent();
  expect(styleText).toContain(":root {");
  expect(styleText).toContain("--primary: oklch(0.6 0.2 250);");
});

test("panel page renders", async () => {
  const page = await ctx.newPage();
  await page.goto(`chrome-extension://${extId}/dist/side-panel/index.html`);
  await expect(page.getByText("COSS 主题调色")).toBeVisible();
});
```

> 说明：fixture 不在 manifest matches 内，content script 经 `addScriptTag` 注入；其消息监听依赖 `chrome.runtime`，在普通页不可用，故第一个用例**直接验证注入函数产出的 `<style>`**。若 `chrome.runtime` 在注入脚本中不可用导致 dispatch 失败，改为在 `addScriptTag` 后用 `page.evaluate` 调用页面内暴露的注入逻辑——为此在 `contentScript.ts` 末尾加：`(window as any).__cossInject = injectOverride;`（仅当 `chrome?.runtime` 不存在时暴露），E2E 改调 `__cossInject({light:{primary:...},dark:{}})` 后断言 `#coss-tweak`。

- [ ] **Step 6: 跑 E2E**

Run: `bun run build && bun run test:e2e`
Expected: 2 passed（headless via channel chromium）。

- [ ] **Step 7: Commit**

```bash
git add package.json playwright.config.ts e2e
git commit -m "test(e2e): playwright extension load + injection + panel render"
```

---

## Phase 5：收尾

### Task 16: 更新 README 与手动冒烟

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 README 功能与适用范围**

把 `README.md` 的「功能特性」补上：取色器、Light/Dark 分别调、预设主题、导出 CSS；
「适用范围」改为 `https://coss.com/ui` 与 `https://coss.com/ui/*`；
「导出功能」由 JSON 改为 CSS。

- [ ] **Step 2: 手动冒烟（spec 6.3 清单）**

Run: `bun run build`
然后 `chrome://extensions` → 加载已解压 `chrome-extension/` → 打开 `https://coss.com/ui/...`：
- [ ] 改 `--primary`，组件即时变色
- [ ] 切亮/暗，两套互不串色
- [ ] 套一个预设，light+dark 生效
- [ ] 刷新 + 站内导航，覆盖仍在
- [ ] 导出 CSS 贴回 shadcn 项目渲染一致
- [ ] 重置后恢复 coss 原样、`#coss-tweak` 移除

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README for v1 (pickers, light/dark, presets, css export)"
```

---

## 自检（写完计划后对照 spec）

- **覆盖**：① 双段注入→Task 8；② 取色器→Task 11；③ 预设→Task 6/13；④ 导出 CSS→Task 5/13；token 分组→Task 3；范围扩 /ui/*→Task 7；测试环境→Task 1/2/15。无遗漏。
- **类型一致**：`ThemeOverride{light,dark}`、token key 不带 `--`、`buildOverrideCss`/`exportCss`/`presetToOverride`/`groupTokens`/`DiscoverResult` 全程一致。
- **共享 builder**：content script 注入与导出均经 theme-core `buildOverrideCss`，无第二实现。
- **开放项**（spec 第 8 节）：导出只导改动（已落实）；取色器用 hex（已落实）。
