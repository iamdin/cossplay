# M2 — tweakcn editor 全量对齐(控制面板 + 完整模型) 设计文档

> 目标(用户 /goal):把扩展的 theme editor 能力做到与 https://tweakcn.com/editor/theme 完全一致。策略=移植 tweakcn editor 本体(源码在 `/Users/dinq/GitHub/jnsahaj/tweakcn`,用户自有),应用目标从 tweakcn 的 demo 组件换成实时注入 coss.com/ui。M2=数据模型+控制面板;M3=导入/导出;M4=HSL/撤销重做/对比度/自定义预设。

## 1. 架构决策

M1 用 delta 覆盖模型 `{base,light,dark}`。tweakcn 用完整主题状态 `ThemeStyles = {light: ThemeStyleProps, dark: ThemeStyleProps}`(~45 字段:全色 + font-sans/serif/mono + radius + shadow 6 参数 + letter-spacing + spacing,非颜色项在 light/dark 间共享 `COMMON_STYLES`)。为"完全一致",M2 采用 tweakcn 模型,M1 delta 模型退役。

核心架构(解决 content bundle 不能引入 culori 的硬约束):
- 面板侧持有完整 themeState,移植 tweakcn editor-store(setStyles/undo/redo/applyPreset/hslAdjustments,Zustand + localStorage persist)。
- 面板用移植的生成器把 themeState 编译成完整 `:root{}/.dark{}` CSS 字符串(颜色 culori 格式化、shadow 用 getShadowMap 展开成 8 档)——全部在面板侧。
- content script 退化为哑注入器:收 `apply-css`(纯字符串)→ 塞进 `<style id="coss-tweak">`;守护(MutationObserver);发现 coss 默认值(getComputedStyle,无 culori);把最后 CSS 存 chrome.storage 供导航/切 tab 重应用。content 永不引入 culori。
- 初始 themeState 由发现的 coss 默认值播种(自动发现,去掉手点「读取当前」)。

数据流:面板控件 → editor-store setStyles → 生成 CSS → apply-css 字符串 → background 存+转发 → content 注入。

## 2. 目标 / 非目标

M2 目标:
1. 采用 tweakcn `ThemeStyles`/`ThemeStyleProps` 模型 + 默认值(移植 types/theme.ts + config/theme.ts,去 Drizzle)。
2. 面板侧统一 CSS 生成器:从 themeState 产出 `:root{}/.dark{}`(颜色/字体/radius/spacing/letter-spacing/shadow 全量),注入与(M3)导出共用。
3. 新消息协议 apply-css;content 退化为哑注入器,持久化 CSS 供重应用;保留 discover 发现 coss 默认。
4. 控制面板对齐:移植 tweakcn 控件——Colors(全 token + Tailwind 调色板取色 + alpha)、Typography(sans/serif/mono 选择 + letter-spacing)、Other/Shadows(radius/spacing 滑块 + shadow 6 参数)。需要的 shadcn/Radix ui 原语一并移植。
5. 去 MVP 化:自动发现播种 themeState,移除/降级手动「读取当前」。
6. 撤销/重做 store 能力到位(UI 按钮可留 M4)。

M2 非目标:导入/导出 UI(M3)、HSL 调色 UI、对比度、自定义预设保存 UI(M4)。永不做:AI 生成、云保存/分享/发布、MCP、v0、Next layout 导出(需后端)。

## 3. 移植清单(文件均在 tweakcn 仓库)

进 packages/theme-core(纯逻辑):
- types/theme.ts → theme-model.ts:ThemeStyleProps、ThemeStyles、ThemePreset、COMMON_STYLES、DEFAULT_FONT_*(去 Drizzle/db schema 引用)。
- config/theme.ts → 合入 theme-model.ts:defaultLightThemeStyles/defaultDarkThemeStyles。
- utils/shadows.ts → shadows.ts:getShadowMap(culori,面板侧)。
- 新增 generate-theme-css.ts:generateThemeCss(styles, opts?{colorFormat}) → `:root{}/.dark{}` 字符串(用 color-converter + getShadowMap)。注入默认 oklch;导出(M3)复用。
- utils/theme-presets.ts(已移植,需把 presetToOverride 改为返回/合并 ThemeStyles)。
- utils/registry/tailwind-colors.ts → tailwind-palette.ts:TAILWIND_PALETTE(调色板取色)。
- normalizeThemeStyles(raw, defaults):迁移/兜底(旧 {base,light,dark} delta → 叠加到 defaults 得完整 ThemeStyles)。

进 apps/side-panel:
- 移植 editor-store(Zustand)→ store/editor-store.ts(themeState/history/undo/redo/applyPreset;persist localStorage)。
- 移植 shadcn/Radix ui 原语(Slider、Tabs、Popover、ScrollArea、Label、Tooltip 等)到 components/ui/(与现有 Base UI 并存,逐步替换)。
- 移植控件:color-picker、color-selector-popover、colors-tab-content、font-picker(字体列表内联静态 FALLBACK_FONTS,Google webfont 由 content 注入 link 复用 M1 机制)、shadow-control、slider-with-input、control-section、theme-control-panel(去 AI hook、URL tab → 内部 state)。
- 新 hooks/use-theme-bridge.ts:发现 coss 默认 → 播种 store → 订阅 store 变化 → 生成 CSS → 发 apply-css。

进 chrome-extension:
- shared/messages.ts:加 apply-css {css};STORAGE_KEY_CSS。
- contentScript.ts:哑注入器(apply-css → style;guard;discover;持久化 css)。
- background.ts:转发 apply-css + 存 css;reapply 用存的 css。

## 4. 分批执行(每批构建+测试绿,逐步收敛)

- 批 A(theme-core 地基):theme-model + defaults + shadows + generate-theme-css + tailwind-palette + normalizeThemeStyles + presets 适配 + 单测。加性,不破坏现有 app。
- 批 B(消息+content):apply-css 协议 + content 哑注入器(暂保留旧 apply-vars)+ background 转发/存储 + e2e 调整。
- 批 C(面板移植):ui 原语 + 控件 + editor-store + use-theme-bridge + 重写 App 为完整控制面板。结束时 app 构建通过、Colors/Typography/Shadows 对齐。
- 批 D(清理):移除 M1 delta 模型残留、旧 apply-vars、旧组件;统一到新模型。

## 5. 测试

- 单元(theme-core):generateThemeCss(颜色/shadow/字体/radius/spacing 各段正确;colorFormat 切换;alpha 保真);getShadowMap(8 档);normalizeThemeStyles(旧 delta → 完整);presets 适配。
- E2E(Playwright):content 收 apply-css 字符串注入 :root/.dark;断言 shadow/radius/font 变量出现。
- 人工冒烟:加载 unpacked → coss.com/ui:三 tab 全控件实时生效;明暗;撤销/重做。

## 6. 风险

- content 必须零 culori:颜色/shadow 计算全在面板侧,content 只收字符串。构建后校验 contentScript.js 0 import、0 culori。
- UI 体系混用:tweakcn 用 shadcn(Radix),side-panel 现用 Base UI。M2 引入 Radix 原语并存,批 C 结束时控制面板统一用移植组件。
- 模型迁移:旧 {base,light,dark} 经 normalizeThemeStyles 叠加到 defaults;无破坏。
- 字体:font-picker 列表静态化(FALLBACK_FONTS),Google webfont 复用 M1 content `<link>` 机制。
- 范围大:严格分批、每批构建+测试绿。

## 7. 待定

- editor-store persist 用 localStorage(与 tweakcn 一致),content 需要的"最后 CSS"另存 chrome.storage。
- 撤销/重做按钮 UI 放 M2 还是 M4:store 在 M2,按钮可顺延 M4。
