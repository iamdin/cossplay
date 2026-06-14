# M1 — 完整 & 正确的 Token 编辑(贴合 coss 真实变量) 设计文档

> 系列:coss-ui-theme-tweak 向 tweakcn 能力对齐的重构,M1/M2/M3 三个里程碑各自独立交付。本文是 **M1**。

## 1. 背景

v1(分支 `feat/v1-theme-editor`,PR #3)实现了 coss 主题的**颜色**编辑:42 个语义色 token、明/暗分别编辑、25 套预设、CSS 导出。但它只覆盖颜色,且取色器有一处正确性缺陷。

本里程碑把编辑能力补到 **coss 真实暴露的全部可主题化表面**,并修正颜色编辑的 alpha 问题。范围严格以 coss 实测 token 为准,不照搬 tweakcn 里 coss 没有的东西。

### coss 实测结论(2026-06-14,live https://coss.com/ui)

- 语义色 token 约 42 个,位于普通 `:root`/`.dark`(非 @layer),v1 已覆盖。
- **大量颜色带 alpha**:`secondary / muted / accent / border / input / sidebar-accent / code-highlight` 等是 `#0000000a` 这类半透明值(解析为 `oklab(... / 0.04)`)。
- **唯一真·非颜色语义 token 是 `--radius`**(`.625rem`,calc 派生 `--radius-sm/md/lg`)。
- Tailwind 基数 **`--spacing`**(`.25rem`)是全局间距旋钮(级联到所有间距工具类),改它对 coss 生效。
- **字体**:body 用 Tailwind `.font-sans` → `var(--font-sans)`,所以覆盖 `--font-sans` 可改 UI 字体;非系统字体需注入 Google Fonts `<link>`。
- **不存在** `--shadow-*` / letter-spacing / `--font-serif` 等被 coss 消费的 token —— 这些 tweakcn 功能在 coss 上无目标,**不做**。

## 2. 目标 / 非目标

**目标**
1. **alpha 取色**:取色、存储、注入、导出全链路保留透明度;修掉半透明 token 被改成纯色、色块预览错误的问题。
2. **`--radius` 滑块**:实时调圆角(级联 sm/md/lg)。
3. **`--spacing` 滑块**:实时调全局间距基数。
4. **UI 字体覆盖**:从精选字体列表设置 `--font-sans`(及可选 `--font-mono`),Google 字体自动注入 webfont。
5. 数据模型新增**与明暗无关的 `base` 桶**承载上述非颜色 token,并保证向后兼容旧存储。

**非目标(本里程碑不做)**
- 导入、导出格式选择、Tailwind v4 变体(→ M2)。
- HSL 全局调、对比度检查、撤销/重做、自定义预设(→ M3)。
- shadow 多参数、letter-spacing、serif 字体(coss 无对应变量,永不做)。

## 3. 架构

沿用 v1 架构:`packages/theme-core`(共享纯逻辑)+ `chrome-extension`(content/background,自包含 IIFE,**禁止 ES import**)+ `apps/side-panel`(React 面板)。M1 的所有新逻辑优先放进 theme-core,使注入与导出继续共用一套实现。

### 3.1 数据模型变更(核心)

```ts
// 现状
interface ThemeOverride { light: Record<string,string>; dark: Record<string,string>; }
// M1
interface ThemeOverride {
  base: Record<string,string>;   // 与明暗无关:radius / spacing / font-sans / font-mono
  light: Record<string,string>;  // 颜色(明)
  dark: Record<string,string>;   // 颜色(暗)
}
```

- `base` 注入 `:root`(`.dark` 不重复),天然对两种模式生效。
- 新增 `normalizeOverride(raw)`:把旧 `{light,dark}` 或缺字段的对象补全为含 `base` 的合法对象;`emptyOverride()` 同步加 `base:{}`。content script / background / hook 读取存储时一律先 `normalizeOverride`。

### 3.2 `buildOverrideCss` 变更

```
:root { <base 原样> ; <light 经 formatColor> }
.dark { <dark 经 formatColor> }
```

- `formatColor` 仅作用于 light/dark 的**颜色值**;`base` 的值(`0.625rem`、字体名)原样输出,不进颜色格式化。
- 注入时 `formatColor = identity`;导出时 `formatColor = v => colorFormatter(v, fmt)`(M1 仍默认 oklch,格式选择留给 M2)。

### 3.3 非颜色控件:静态配置而非页面发现

radius 被 `CSS.supports("color")` 过滤、spacing/font 不在可读规则里,故**不靠 discover 发现**,改用 theme-core 中的静态配置:

```ts
interface NonColorControl {
  token: string;                 // "radius" | "spacing" | "font-sans" | "font-mono"
  label: string;
  kind: "slider" | "font";
  min?: number; max?: number; step?: number; unit?: string; // slider
}
export const NON_COLOR_CONTROLS: NonColorControl[]
```

- radius:slider,0–2,step 0.025,unit `rem`。
- spacing:slider,0.15–0.35,step 0.005,unit `rem`。
- font-sans / font-mono:font 选择器,选项来自 `FONTS` 列表。

### 3.4 字体

theme-core 提供精选 `FONTS`(~12 项):系统栈(System / Inter-ish system-ui)+ 常用 Google 字体(Inter、Geist、Roboto、Manrope、JetBrains Mono、Fira Code 等),每项 `{ id, label, stack, google?: { family, weights } }`。

- 选中后存 `base["font-sans"] = stack`(或 mono)。
- **content script** 检测 `base` 中字体值对应的 Google 项,若有则注入/更新 `<link id="coss-tweak-fonts">` 指向 `https://fonts.googleapis.com/css2?...`(纯客户端,走公共 CDN;无 Google 项则移除该 link)。webfont 加载是渐进增强,失败不影响其余注入。

### 3.5 discover 扩展

`DiscoverResult` 增加 `base: Record<string,string>`:content script 用 `getComputedStyle(documentElement).getPropertyValue('--'+token)` 读取 `NON_COLOR_CONTROLS` 各 token 的当前默认(radius/spacing 有值;font 通常空)。面板滑块/字体初始值 = `override.base[token] ?? defaults.base[token]`。

### 3.6 取色器 alpha

- `ColorPicker` 用 react-colorful 的 **`HexAlphaColorPicker`**(进出 `#rrggbbaa`)替换 `HexColorPicker`。
- 色块按钮加**棋盘格背景**以显示透明度。
- `color-converter` 增加 alpha 支持:
  - `colorFormatter` 四种格式都带 alpha——oklch/hsl 在 `a<1` 时输出 `... / a`;rgb 用 `formatRgb`(已含 alpha);hex 在 `a<1` 时用 `formatHex8`,否则 `formatHex`。
  - 新增 `toHex8(value)` 供取色器显示(保留 alpha)。
  - 存储仍归一为 oklch(含 alpha)。

## 4. 文件变更地图

**theme-core**
- `types.ts`:`ThemeOverride` 加 `base`;`emptyOverride` 加 `base`;新增 `normalizeOverride`。
- `override-css.ts`:base 原样 + light/dark 经 `formatColor`。
- `color-converter.ts`:四格式 alpha;新增 `toHex8`。
- `non-color-controls.ts`(新):`NonColorControl`、`NON_COLOR_CONTROLS`。
- `fonts.ts`(新):`Font`、`FONTS`、`googleFontHref(families)`。
- `index.ts`:导出新模块。
- `__tests__`:override-css(base 段、颜色格式化只作用于颜色)、color-converter(alpha 往返)、normalizeOverride(旧→新)、googleFontHref。

**chrome-extension**
- `shared/messages.ts`:`DiscoverResult` 加 `base`。
- `contentScript.ts`:`loadStored`/guard/apply 经 `normalizeOverride`;`discover` 读 base 默认;注入后处理 `<link id="coss-tweak-fonts">`。
- `background.ts`:**不改**——透明转发 override(不假设其形状),旧数据由 content 的 `injectOverride` → `normalizeOverride` 在注入时兜底。

**side-panel**
- `hooks/use-theme-override.ts`:`ThemeOverride` 含 base;`defaults` 加 base;新增 `setBaseToken`;`DiscoverResult` 本地类型加 base。
- `components/color-picker.tsx`:HexAlpha + 棋盘格;`toHex8`。
- `components/non-color-controls.tsx`(新):渲染 `NON_COLOR_CONTROLS`(滑块 + 字体选择)。
- `components/font-select.tsx`(新):基于 `FONTS` 的下拉。
- `App.tsx`:在颜色分组前/后插入"布局(radius/spacing)"与"字体"区。

## 5. 测试

**5.1 单元(Vitest,theme-core)**
- `normalizeOverride`:`{light,dark}` → 补 `base:{}`;已合法对象幂等;缺/多字段健壮。
- `buildOverrideCss`:base 进 `:root`、不进 `.dark`;`formatColor` 不作用于 base;空 base 不产生空段。
- `colorFormatter` alpha:`#0000000a` ↔ oklch(含 `/`)↔ rgba 往返不丢 alpha;`a=1` 时不输出 `/ 1`。
- `toHex8`:半透明→8 位;不透明→可 6 位或 8 位(约定其一并测)。
- `googleFontHref`:多 family 拼接正确;空列表返回 null。

**5.2 E2E(Playwright)**
- 沿用 v1 的 `__cossInject` 注入测试,断言 `:root` 含 base 变量(如 `--radius`)、`.dark` 不含;半透明色注入后 computed 仍带 alpha。

**5.3 人工冒烟(加载 unpacked + 访问 coss.com/ui)**
- 调 radius/spacing 滑块,页面圆角/间距实时变化。
- 改 `secondary`(半透明)后仍透明,不变纯色;色块显示棋盘格透明。
- 选 Google 字体,UI 字体变化(webfont 加载)。
- 切明暗:base(radius/spacing/font)在两模式都生效;颜色按模式各自生效。
- 导出 CSS:base 在 `:root`,颜色带 alpha。

## 6. 风险 / 注意

- **存储迁移**:`base` 为新增字段。统一经 `normalizeOverride` 兜底;v1 用户的旧 `{light,dark}` 自动补全,无破坏。
- **content bundle 不得引入 culori**:`override-css.ts` 仍只做字符串拼接(`formatColor` 由调用方注入);`non-color-controls.ts`/`fonts.ts` 为纯数据,`sideEffects:false` 保证不被打入 content。验证:构建后 `contentScript.js` 仍 0 `import`、不含 culori。
- **webfont 网络**:Google 字体需联网(仍属纯客户端,无自有后端);离线时仅字体不生效,其余照常。
- **alpha 存储格式**:统一 oklch 含 alpha;需确认 culori 在各格式下 alpha 往返稳定(单测覆盖)。
- **spacing 影响面大**:改 `--spacing` 会整体改变布局密度;滑块范围保守(0.15–0.35rem),并在 UI 标注"全局间距"。

## 7. 待定项

- `font-mono` 是否纳入 M1:默认纳入(coss 代码块用 mono);若实现成本偏高可降级为仅 `font-sans`,M2 再补。
- 字体列表的具体 12 项与 Google weights:实现时定稿(倾向 sans:System/Inter/Geist/Manrope/Roboto;mono:System/JetBrains Mono/Fira Code/Geist Mono)。
