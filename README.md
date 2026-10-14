# Cossplay

一个 Chrome 扩展，从停靠的侧边栏实时编辑任何用 [coss ui](https://coss.com/ui)（或 shadcn 风格变量）搭建的网站的主题变量。编辑模型和 [Shadify](https://github.com/oxwen11/shadify) 相同，用的是 coss ui 的 token 集。

## 功能

| 功能 | 说明 |
|---|---|
| 检测 | 读取 `:root`、`.dark`、`[data-theme]` 和 `@theme` 上的变量；浏览器把 `var()`、`color-mix()` 和 `--alpha()` 解析成具体颜色。站点栏会显示是否检测到变量。 |
| Token | coss `globals.css`：41 种颜色（含 info / success / warning / code），加上 tweakcn 的共用字段：`font-sans` / `font-serif` / `font-mono`、`radius`、`letter-spacing`、`spacing`、阴影颜色 / 不透明度 / 模糊 / 扩展 / 偏移。 |
| 改色 | 分组颜色，可搜索；HEX / OKLCH / HSL / RGB 输入、拾色器、通道滑杆、不透明度和复制。写回时用站点自己的颜色格式。 |
| 浅色 / 深色 | 颜色按模式分别编辑；共用字段两种模式一起改。可以在页面上预览任一模式。 |
| 预设 | 42 个 tweakcn 预设，加上 coss 的默认主题；可重置到预设，或重置到站点原来的主题。预设只覆盖它们定义的 token。 |
| 调整 | 全局 HSL 色相偏移、饱和度与明度缩放（15 个预设），以及侧栏颜色同步。 |
| 排版 | 自由字体栈，按类别搜索 Google 字体，显式加载字体（站点 CSP 可能拦住），以及字距。 |
| 对比度 | 15 组 coss 颜色对的 WCAG 检查，可只看有问题的。 |
| 历史 | 每次编辑都可撤销 / 重做，⌘Z / ⌘⇧Z。 |
| 导入 | 注册表或 tweakcn URL、粘贴的 CSS / JSON，或 CSS / JSON 文件。 |
| 导出 | Tailwind v4 OKLCH CSS（coss `globals.css` 的形状）、Tailwind v3 HSL CSS、注册表 JSON、浅色 / 深色 token JSON、Tailwind v3 配置、Next.js 字体布局；可复制或下载。 |
| shadcn CLI | 每个预设都是一项静态 shadcn 注册表，地址为 `https://cossplay.vercel.app/r/themes/<preset>.json`（索引：`registry.json`），由网页构建生成。未改动的预设在导出里显示 `shadcn add`（pnpm / npm / yarn / bun）。 |
| MCP | 插头按钮显示 `components.json` 和 MCP 配置（Cursor、Windsurf、Claude Code、VS Code），供 shadcn 的 MCP 服务使用 `@cossplay` 注册表。 |
| 按站点保存 | 按 origin 保存，带开关；重新加载时在首次绘制前恢复。 |

只注入改过的 token：没动过的变量仍跟着站点，组件作用域的变量（例如 `[--radius:9999px]`）不动。阴影只在站点 CSS 读取阴影变量的地方变化；coss ui 自己的组件把阴影编译成了固定值。

## 安装

```bash
pnpm install
pnpm build
```

打开 `chrome://extensions`，启用开发者模式，选择 **加载已解压的扩展程序**，选中 `apps/extension/dist`。打开一个 coss ui 站点（例如 `https://coss.com/ui`），点扩展图标打开侧边栏。

Chrome 网上应用店的安装包、上架文案和图片见 [`docs/store/listing.md`](docs/store/listing.md)。

## 开发

在仓库根目录：

- `pnpm dev`：扩展的 CRXJS 开发模式（带 HMR），以及网页开发服务器
- `pnpm build`：把扩展构建到 `apps/extension/dist`，把网站构建到 `apps/web/dist/client`
- `pnpm check:type`、`pnpm format`、`pnpm lint`（加上 `:fix` 即自动修复）
- `pnpm test`：core 单元测试
- `pnpm test:e2e`：先构建，再跑 Playwright 测试

## 布局

pnpm + Turborepo 单体仓库：

- `apps/extension`：MV3 扩展（Vite + CRXJS）：侧边栏宿主、content script、service worker
- `apps/web`：网站（TanStack Start，预渲染成 `dist/client` 里的静态文件），从 Git 部署到 Vercel，根目录为 `apps/web`。`/` 是落地页；`/editor` 是浏览器里的主题 Editor，预览从 `@coss` 注册表装进 `src/components` 的 coss ui particle
- `packages/editor`：扩展和 Editor 共用的面板（控件、对话框、store）；各自设置一个 Host，负责存储、拉取和字体
- `packages/ui`：shadcn 组件、`cn`、`globals.css`（扩展面板）和 `base.css`（不含主题值的组件样式）
- `packages/core`：共享逻辑。`@cossplay/core/coss` 放 token、站点状态和历史、worker 存储以及消息协议；`/coss/import` 是仅面板使用的 CSS / JSON 导入器
- `packages/core/scripts`：`sync:defaults` 从 coss 注册表样式重新生成 coss 默认值；`sync:tweakcn` 从一份冻结的 tweakcn 克隆重新生成 tweakcn 默认值、预设和 HSL 预设
- `tooling/typescript`：共享 tsconfig

## 致谢

预设、默认值和主题数据形状来自 [tweakcn](https://github.com/jnsahaj/tweakcn)（Apache-2.0，见 `licenses/tweakcn.txt`）。与 coss、tweakcn 或 shadcn/ui 均无关联。
