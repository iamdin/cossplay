# COSS UI Theme Tweak

一个在侧边栏实时调整 [coss ui](https://coss.com/ui) 主题变量的 Chrome 扩展，适用于任何使用 coss ui（或 shadcn 风格变量）的网站。

## 功能特性

- **coss ui 变量**：token 集合即 coss `globals.css`——41 个颜色（含 info / success / warning / code）、`--radius`、`--font-sans` / `--font-heading` / `--font-mono`
- **从网站原主题开始**：检测页面 `:root` / `.dark` / `[data-theme]` 及字体变量类上的值；`var()`、`color-mix()`、`--alpha()` 由浏览器解析成具体颜色；写回时保持网站原颜色格式
- **只注入改动的 token**：未改动的变量继续跟随网站自己的定义；Tailwind 任意属性（如 `[--radius:9999px]`）这类组件局部变量不会被覆盖
- **按网站保存**：每个 origin 独立保存、可单独停用；刷新时在首帧前恢复，不闪原主题
- **Light / Dark 分别编辑**，可在页面上预览任一模式；圆角和字体两种模式共享
- **撤销 / 重做 / 重置**：覆盖全部编辑操作，重置回网站原主题
- **预设与导入**：42 套 tweakcn 预设（只覆盖其定义的 token）；可粘贴 CSS / JSON 或填写 tweakcn / registry URL
- **HSL 全局调整、WCAG 对比度检查、Google 字体加载、本地主题（保存 / 重命名 / 删除 / 应用）**
- **导出**：与 coss `globals.css` 同形的 `index.css`（Tailwind v4）、`layout.tsx`（next/font）、shadcn `registry.json`

## 适用范围

内容脚本对所有 `http(s)` 页面运行，只在检测到主题变量后可编辑；工具栏徽标显示是否检测到。

## 安装使用

1. 克隆本仓库并安装依赖：
   ```bash
   bun install
   ```

2. 构建扩展：
   ```bash
   bun run build
   ```

3. 在 Chrome 中加载扩展：
   - 打开 `chrome://extensions/`
   - 开启「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择 `chrome-extension` 目录

4. 访问使用 coss ui 的网站（如 `https://coss.com/ui`），点击扩展图标打开侧边栏即可开始调整主题

## 导出功能

「代码」对话框导出完整主题（颜色格式可选 oklch / hsl / rgb / hex）：`index.css` 与 coss `globals.css` 同形（`@theme inline` 映射 + `:root` / `.dark`），可直接替换其主题部分；另有 `layout.tsx`（next/font 字体变量）与 shadcn `registry.json`。

## 开发

常用脚本（仓库根目录）：

- `bun run dev`：同时监听侧边栏与扩展构建
- `bun run build`：构建所有工作区包
- `bun run lint`：运行所有工作区包的 lint
- `bun run test`：单元测试（theme-core）
- `bun run test:e2e`：Playwright E2E 测试（需先执行 `bun run build`）

## 仓库结构

- `apps/side-panel`：侧边栏界面（React + Vite）
- `chrome-extension`：扩展构建与打包
- `packages/theme-core`：共享纯逻辑；`theme-core/coss` 为 coss token、站点状态与历史、worker 存储、消息协议（移植自 Shadify）
- `packages/theme-core/scripts/sync-coss-defaults.ts`：从 coss 仓库的 `globals.css` 重新生成默认值

## 手动冒烟清单

以下步骤需人工在真实浏览器中验证（自动化测试不覆盖）：

- [ ] 在 `chrome://extensions/` 加载已解压的 `chrome-extension/` 目录，扩展正常出现
- [ ] 打开 `https://coss.com/ui`，侧边栏面板可以打开
- [ ] 修改任意 token 颜色，页面实时生效（无需刷新）
- [ ] 切换 Light ↔ Dark 模式，两套颜色互不串扰
- [ ] 选择预设主题，页面颜色整体切换
- [ ] 刷新页面或在同一网站内导航，修改值持久保留；停用后恢复原站
- [ ] 点击「导出 CSS」，将输出内容贴回项目样式文件，效果一致
- [ ] 点击「一键重置」，页面恢复原始主题
