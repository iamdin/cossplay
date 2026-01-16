# COSS UI Theme Tweak

一个用于实时调整 [COSS](https://coss.com) 网站主题色彩的 Chrome 扩展。

## 功能特性

- **实时预览**：修改 CSS 变量后立即在页面上看到效果，无需刷新
- **自动发现**：自动扫描页面中 `:root` 和 `.dark` 选择器定义的所有 CSS 自定义属性
- **持久化存储**：修改的变量值会自动保存，下次打开页面时自动应用
- **侧边栏界面**：通过 Chrome 侧边栏提供直观的变量编辑界面
- **导出功能**：支持将修改后的变量导出为 JSON 格式，方便分享或备份
- **一键重置**：可随时重置所有修改，恢复原始主题

## 适用范围

目前仅对以下页面生效：
- `https://coss.com/ui/docs`
- `https://coss.com/ui/docs/*`
- `https://coss.com/ui/particles`
- `https://coss.com/ui/particles/*`

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

4. 访问 coss.com/ui/docs，点击扩展图标打开侧边栏即可开始调整主题

## 开发

常用脚本（仓库根目录）：

- `bun run dev`：同时监听侧边栏与扩展构建
- `bun run build`：构建所有工作区包
- `bun run lint`：运行所有工作区包的 lint

## 仓库结构

- `apps/side-panel`：侧边栏界面（React + Vite）
- `chrome-extension`：扩展构建与打包
