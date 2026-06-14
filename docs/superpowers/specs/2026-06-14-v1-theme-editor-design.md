# COSS UI Theme Tweak — v1 设计文档

- 日期：2026-06-14
- 状态：待评审
- 仓库：`iamdin/coss-ui-theme-tweak`（本地 `~/Code/iamdin/coss-ui-theme-tweak`）

## 1. 背景

仓库里已有一个可用的 MVP：一个 MV3 Chrome 扩展，通过原生 Side Panel + content script，
对 `coss.com/ui` 实时覆盖 CSS 变量换肤。架构与 tweakcn 同源（改 CSS 变量），但目标是**真实的 coss
网站本身**，而非 iframe 预览。

技术侦察确认 coss.com/ui 的主题机制与 shadcn 几乎一致：`:root` 上 ~45 个 CSS 自定义属性
（`--background --foreground --primary … --chart-1..5 --sidebar-*`，外加 coss 专属的
`--info --success --warning --code --code-highlight --font-heading`），暗色定义在 `.dark{}`，
靠 `<html>` 的 `.light/.dark` class 切换。

### MVP 现状（已完成）

- **monorepo**：bun workspaces + turbo。`apps/side-panel`（React 19 + Vite 7 + Tailwind v4
  + Base UI + `shadcn/tailwind.css`，自带一套 coss UI 组件与**独立 `index.css` 主题**，故面板自身不被换肤污染）；
  `chrome-extension`（`background.ts` + `contentScript.ts`，Vite 多入口构建已跑通）。
- **manifest**：MV3，`sidePanel + storage + tabs`，host `coss.com/*`，content script 注入
  `/ui/docs/*` 与 `/ui/particles/*`，点图标开侧栏。
- **contentScript**：`discoverAllVars()` 扫样式表的 `:root`/`.dark` 规则收集变量与原始值，
  通过「临时移除注入样式 → `getComputedStyle` → 还原」拿到原始解析色值；消息
  `apply-vars/reset-vars/get-vars`；导航/切 tab 后自动重新应用。
- **background**：`set-vars`（存 storage + 转发当前 tab）、`reset-vars`、`reload-target`、`get-vars` 中转。
- **side-panel `App.tsx`**：扁平列出所有变量，每个一个**文本输入框**改值、即时预览；按钮「重置全部 / 读取当前 / 导出 JSON / 刷新页面」。
- 已验证 `bun run build` 通过，产出 `dist/contentScript.js`、`dist/background.js`、`dist/side-panel/*`。

## 2. v1 目标

在现有 MVP 上补齐四块能力，把「能改变量」升级为「好用的调色 + 导出工具」：

1. **逐 token 取色器**（取代纯文本框）。
2. **Light / Dark 分别编辑**（当前只能改当前模式）。
3. **预设主题**（搬入 tweakcn 全部预设）。
4. **导出 CSS**（取代导出 JSON）。

并引入 token 分组/标签，与 tweakcn 的颜色逻辑复用。

### 非目标（v1 不做，留后续）

- 全局 HSL 微调、对比度检查。
- coss 专属 token（info/success/warning/code/font-heading）的预设取值（套预设时它们保持 coss 默认）。
- 导出完整主题（v1 只导出「被改过的 token」补丁；完整导出留开关位后续做）。
- 跨浏览器（Firefox/Edge）、云端账号/分享。

## 3. 架构（沿用方案 A，最小改动）

```
Side Panel (React, 独立主题)  --chrome.runtime/messages-->  Content Script (注入 coss 页)
        |  chrome.storage.local  { light, dark }  |
Background service worker：开面板 + 消息中转 + 导航后重应用
```

不新增进程，不引入扩展框架（维持纯 React + Vite + TS、手写 manifest + 多入口）。

## 4. 详细设计

### 4.1 Light/Dark 双段注入（核心架构改动）

- **注入方式**：contentScript 不再用 `root.style.setProperty`（内联、只影响当前模式），
  改为维护一个 `<style id="coss-tweak">` 注入 `<head>` 末尾，内容两段：
  ```css
  :root { --primary: …; --background: …; }
  .dark { --primary: …; … }
  ```
  靠 CSS 源顺序压过 coss 自己的定义；用户用 coss 自带开关切 light/dark 时，对应那套自动生效。
  配 `MutationObserver`，若 `<style>` 被框架移除则重新插回。
- **storage 模型**：由扁平 `cossThemeVars: Record<name,val>` 改为
  ```ts
  type ThemeOverride = { light: Record<string,string>; dark: Record<string,string> }
  ```
  存于 `chrome.storage.local`，key `cossThemeVars`（版本化，旧扁平数据直接弃用，不迁移）。
- **读默认值**：扩展现有「临时移除→getComputedStyle→还原」逻辑，增加**临时给 `<html>` 切 `.dark`**
  读出暗色那套解析值，再还原。一次性在面板打开 / 「读取当前」时执行，返回 `{ light, dark }` 两套默认。
- **消息协议调整**：`apply-vars` 载荷改为 `{ light, dark }`；`get-vars` 返回 `{ raw, computed, names }` 扩展为分 light/dark 两套。

### 4.2 逐 token 取色器

- 每个变量行：色块按钮 → 弹出取色器 + hex/oklch 文本输入（保留手输）。
- 依赖：`react-colorful`（取色器，~3KB）、`culori`（解析/转换，与 tweakcn 一致）。
- coss 自身用 oklch 著色，覆盖值默认输出 **oklch**；面板内部转 hex 供取色器显示。
- 顶部 **Light/Dark 切换**：既选「当前编辑哪套」，也通过消息让 coss 切到对应模式，保证预览所见即所得。

### 4.3 预设主题

- 搬入 tweakcn 的 `theme-presets`（全部 20+ 套，shadcn 子集）。
- 面板预设下拉，选中即填充 light+dark 两套覆盖并即时预览。
- coss 专属 token 不在预设内 → 保持 coss 默认（已在非目标说明）。

### 4.4 导出 CSS

- 「导出 JSON」改为「导出 CSS」，复用 tweakcn 的 `theme-style-generator`（Tailwind v4 路径）。
- v1 **只导出被改过的 token**，输出 `:root{} .dark{}` 两段，一键复制。
- 预留「导出完整主题」开关（v1 不实现）。

### 4.5 token 分组与复用

新增 `apps/side-panel/src/lib/`（来源 tweakcn，MIT 协议）：

- `color-converter.ts`：culori 封装（hex/oklch/rgb 互转）。
- `theme-style-generator.ts`：导出 CSS（裁剪到 v1 需要的 v4 路径）。
- `theme-presets.ts`：预设数据。
- `token-schema.ts`（新增）：token 分组（基础 / 主色 / 语义 / sidebar / chart / 其它）+ 显示标签；
  未知变量归入「其它」，保证 coss 改 token 也不崩。

### 4.6 manifest 调整

- content script `matches` 扩到 `https://coss.com/ui/*`（含 `/ui` 自身）；host_permissions 维持 `coss.com/*`。
- background 的 `isTargetUrl` 同步放宽到 `/ui/` 前缀。

## 5. 改动文件地图

| 文件 | 改动 |
|---|---|
| `chrome-extension/manifest.json` | content script matches 扩到 `/ui/*` |
| `chrome-extension/src/contentScript.ts` | 改 `<style>` 双段注入 + MutationObserver；读默认值支持 light/dark；消息载荷 `{light,dark}` |
| `chrome-extension/src/background.ts` | `isTargetUrl` 放宽；存/转发 `{light,dark}` |
| `apps/side-panel/src/App.tsx` | Light/Dark 切换、分组渲染、取色器、预设下拉、导出 CSS |
| `apps/side-panel/src/components/` | 新增 ColorPicker、TokenGroup、PresetSelect、ExportDialog |
| `apps/side-panel/src/lib/*` | 搬入 tweakcn：color-converter / theme-style-generator / theme-presets；新增 token-schema |
| `apps/side-panel/package.json` | 加 `react-colorful`、`culori`、`@types/culori` |

## 6. 测试

> 现状：仓库**尚无任何测试设施**（无 vitest、无 test 脚本）。v1 需先搭最小测试环境，再分「单测」与「手动 E2E」两层。

### 6.0 先搭环境（一次性任务）

- **单测**：`apps/side-panel` 加 devDeps：`vitest`、`jsdom`、`@vitest/coverage-v8`；测 `chrome.*` 逻辑加 `sinon-chrome`（或 `@webext-core/fake-browser`）。
  - 复用现有 `vite.config.ts`，加 `test: { environment: 'jsdom', globals: true }`（vitest 直接读 vite 配置）。
  - `apps/side-panel/package.json` 加脚本：`"test": "vitest run"`、`"test:watch": "vitest"`。
  - 测试就近放：`src/lib/__tests__/*.test.ts`。
- **自动化 E2E**：仓库根加 devDeps `@playwright/test`；新增 `e2e/` 放规约与本地 fixture 页。
  - 根 `package.json` 加 `"test:e2e": "playwright test"`。
- 根 `package.json` 加聚合：`"test": "bun run --filter '*' test"`（单测）；E2E 单独 `test:e2e`（需先 `bun run build`）。
- **验收**：`bun run test` 与 `bun run test:e2e` 均全绿。

### 6.1 单元测试（Vitest + jsdom，覆盖纯逻辑）

设计上把可测的纯函数从副作用里拆出来，逐个断言：

| 被测单元 | 文件 | 用例（断言点） |
|---|---|---|
| 颜色互转 | `lib/color-converter.ts` | `hex→oklch→hex` 往返误差在阈值内；非法输入返回兜底；`lab()/color-mix()` 输入能被解析或被显式拒绝 |
| 导出 CSS | `lib/theme-style-generator.ts` | 给定 `{light:{primary:…}, dark:{primary:…}}` → 输出**字符串精确等于**期望的 `:root{ --primary: … }\n.dark{ --primary: … }`；空改动 → 空串；只改 light → 不产出 `.dark{}` |
| token 分组 | `lib/token-schema.ts` | `--primary`→主色组、`--sidebar-ring`→sidebar 组、`--xyz-unknown`→「其它」组；分组顺序稳定 |
| 注入 CSS 构建 | content script 抽出的 `buildOverrideCss({light,dark})` 纯函数 | 同导出断言（注入与导出共用一个 builder，避免两套逻辑漂移） |

content script 中依赖 `chrome.*` / `getComputedStyle` 的部分**不做单测**（见 6.2），但要把
`buildOverrideCss`、变量名解析等纯逻辑抽成独立函数以便单测。

### 6.2 自动化 E2E（Playwright + 本地 fixture，覆盖 DOM/chrome API/注入）

`chrome.runtime` 消息、`getComputedStyle` 解析、`<style>` 注入与 specificity 这些
**只能在真实扩展环境验证**——用 Playwright 把构建好的扩展真的加载进 Chromium 跑。

- **加载扩展**（官方文档核对）：
  ```ts
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",                          // 允许扩展在 headless 下运行（CI 友好）
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,              // extPath = chrome-extension/（build 后）
    ],
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent("serviceworker");
  const extId = sw.url().split("/")[2];
  ```
- **本地 fixture，不打真实 coss**：`e2e/fixtures/coss-mock.html` 复刻 coss 的 `:root{}`/`.dark{}`
  token 结构与几个组件，content script 注到它上面断言。避免联网/代理导致的 flaky；真实 coss 留给 6.4 冒烟。
  - 让 content script 也匹配 fixture：测试时用单独的 manifest matches，或经 `chrome.scripting` 在 fixture tab 注入。
- **用例**：
  1. content script 注入：fixture 页改 `--primary` → 断言 `getComputedStyle(html).getPropertyValue('--primary')` 已变、`<style id="coss-tweak">` 存在。
  2. Light/Dark 双段：给 `<html>` 加/去 `.dark`，断言两套各自取到对应覆盖值，互不串色。
  3. 面板 UI：开 tab 到 `chrome-extension://${extId}/dist/side-panel/index.html`，驱动取色器/预设/导出按钮，断言 DOM 与剪贴板内容。
  4. background：`sw.evaluate(...)` 调 `chrome.storage` 验证 set-vars/reset-vars 持久化。
- **注意**：MV3 service worker 30s 空闲挂起，挂起瞬间在飞的 `evaluate()` 会抛错、之后自动恢复 → 对 `sw.evaluate` 加重试。
- **验收**：`bun run build && bun run test:e2e` 全绿（headless）。

### 6.3 手动冒烟（真实 coss，最终肉眼确认）

自动化覆盖逻辑后，真实站点过一遍：`bun run build` → `chrome://extensions` 加载已解压
`chrome-extension/` → 打开 `https://coss.com/ui/...` → 实时改色 / 切 light·dark 互不串 /
套预设 / 刷新+导航持久化 / 导出贴回一致 / 重置还原。此清单同时作为 PR 自测清单。

## 7. 风险

1. **Light/Dark 注入的 specificity**：`:root{}` 与 coss `:root{}` 同特异性，靠追加在后取胜；
   若 coss 用 `html.dark` 提权，则我方相应用 `html.dark`/`:root` 提到同级或更高。E2E 验证。
2. **content script 无 HMR**：改扩展层需手动 rebuild + 在 chrome://extensions 重载（放弃 WXT 的代价，已知接受）。
3. **coss 改 token 结构**：靠运行时读默认值缓解，schema 仅用于分组/标签。
4. **SPA 导航**：Next 客户端跳转不清 `<head>`，注入持续生效；MutationObserver 兜底。
5. **culori 解析 coss 原始值**：coss 计算值是 `lab()`/`color-mix()`；默认值统一走「getComputedStyle 取解析 rgb」而非解析授权串，规避解析边界问题。

## 8. 待评审/开放项

- 导出是否 v1 就要「完整主题」开关？（当前定：只导出改动）
- 取色器是否需要 oklch 滑杆（更贴近 coss 著色），还是 hex 取色器 + 文本足够？（当前定：hex 取色器 + 文本）
