# COSS UI Theme Tweak

一个用于实时调整 [COSS](https://coss.com) 网站主题色彩的 Chrome 扩展。

## 功能特性

- **逐 token 取色器**：基于 react-colorful，可逐个编辑 CSS 设计 token
- **Light / Dark 分别编辑**：亮色模式与暗色模式的 token 独立存储、互不串扰
- **内置 25 套预设主题**：内置来自 tweakcn 的预设，一键切换配色方案
- **导出 CSS**：仅导出已改动的 token，格式为 Tailwind v4 兼容的 oklch `:root{}`/`.dark{}` 块
- **实时预览**：修改 token 后立即在页面上看到效果，无需刷新
- **持久化存储**：修改值自动保存，刷新或跨页面导航后自动应用
- **自动发现 token**：自动扫描页面 `:root` 和 `.dark` 选择器定义的所有 CSS 自定义属性
- **一键重置**：随时重置全部修改，恢复原始主题

## 适用范围

对以下页面生效（COSS /ui 整节）：

- `https://coss.com/ui`
- `https://coss.com/ui/*`

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

4. 访问 `https://coss.com/ui`，点击扩展图标打开侧边栏即可开始调整主题

## 导出功能

导出产物为 CSS 格式（oklch，仅已改动的 token），可直接贴入项目的全局样式：

```css
:root {
  --primary: oklch(0.6 0.2 250);
}
.dark {
  --primary: oklch(0.7 0.1 250);
}
```

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
- `packages/theme-core`：共享纯逻辑——token schema、颜色转换、override→CSS builder、预设

## 手动冒烟清单

以下步骤需人工在真实浏览器中验证（自动化测试不覆盖）：

- [ ] 在 `chrome://extensions/` 加载已解压的 `chrome-extension/` 目录，扩展正常出现
- [ ] 打开 `https://coss.com/ui`，侧边栏面板可以打开
- [ ] 修改任意 token 颜色，页面实时生效（无需刷新）
- [ ] 切换 Light ↔ Dark 模式，两套颜色互不串扰
- [ ] 选择预设主题，页面颜色整体切换
- [ ] 刷新页面或在 `/ui/*` 内导航，修改值持久保留
- [ ] 点击「导出 CSS」，将输出内容贴回项目样式文件，效果一致
- [ ] 点击「一键重置」，页面恢复原始主题
