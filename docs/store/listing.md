# Chrome 网上应用店上架材料

开发者后台各个标签要填的内容，按标签顺序排列。图片在本目录；`apps/extension/scripts/store-screenshots.ts` 用构建好的扩展和线上 https://coss.com/ui 重新生成它们（先 `pnpm build`，再在 `apps/extension` 里运行 `node scripts/store-screenshots.ts`）。

## 安装包

```bash
pnpm install --frozen-lockfile
pnpm build
(cd apps/extension/dist && zip -r ../cossplay-v0.1.0.zip .)
```

上传 `apps/extension/cossplay-v0.1.0.zip`。压缩包根目录有 `manifest.json`，这是商店的要求；它和 `chrome-extension-release.yml` 工作流附在 `v*` GitHub 发布上的是同一份归档。之后每次上传都要提高 `apps/extension/package.json` 里的 `version`（清单的版本从那里来）。

版本是 0.1.0，因为标签 `v0.0.1` 到 `v0.0.4` 已经属于更早的 coss-ui-theme-tweak 构建的发布，所以这份代码不能再打 0.0.3 的标签并发布。

## 商品详情标签

**名称**：Cossplay

**摘要**（来自清单的 `description`，最多 132 个字符；清单里的原文照用）：

> 在侧边栏实时编辑任意网站上的 coss ui 主题变量。

**描述**：

```text
Cossplay 从 Chrome 的侧边栏实时编辑用 coss ui 搭建的网站（或任何使用 shadcn 风格 CSS 变量的站点）的主题。改动在你操作时就显示在页面上，而且只在你的屏幕上。

打开一个 coss ui 站点，点 Cossplay 图标，侧边栏会读出站点自己的主题：:root、.dark 和 [data-theme] 上的颜色，以及字体、圆角、间距、字距和阴影。

- 43 个预设：coss ui 的默认主题和 42 个 tweakcn 预设。可以逐个切换或随机。
- 用 HEX、OKLCH、HSL 或 RGB 改色，带拾色器、Tailwind 色板、通道滑杆和不透明度。写回时用站点自己的颜色格式。
- 浅色和深色分开编辑；可以在页面上预览任一模式。
- 检查：在页面上悬停元素，看它用了哪些主题令牌（token），点一个即可编辑。
- 全局色相、饱和度和明度调整。
- 排版：带 Google Fonts 搜索的字体栈，以及字距。
- 15 组颜色对的 WCAG 对比度检查。
- 每次编辑都可撤销和重做。
- 从 tweakcn 或 shadcn 注册表 URL、粘贴的 CSS 或 JSON、或文件导入主题。
- 导出 Tailwind v4（OKLCH）或 v3（HSL）CSS、注册表 JSON、令牌 JSON、Tailwind v3 配置或 Next.js 字体布局。未改动的预设还会显示 shadcn CLI 安装命令。
- 按站点保存，带开关；再次回来时，在页面绘制前恢复。

只注入你编辑过的令牌；其余仍跟着站点。什么都不会上传：主题留在 Chrome 的本地扩展存储里，没有账户，也没有服务器。

同一个编辑器也可以不装扩展，在 https://cossplay.vercel.app/editor 使用。

与 coss、tweakcn 或 shadcn/ui 均无关联。预设来自 tweakcn（Apache-2.0）。
```

**类别**：开发者工具

**语言**：中文

**图片**：

| 字段 | 文件 |
|---|---|
| 商店图标（128x128） | `apps/extension/public/icons/icon-128.png` |
| 截图（1280x800） | `screenshot-1-presets.png`、`screenshot-2-dark-channels.png`、`screenshot-3-inspect.png`、`screenshot-4-export.png` |
| 小宣传图（440x280） | `promo-small-440x280.png` |
| 横幅宣传图（1400x560） | `promo-marquee-1400x560.png` |

**官方网址**：无（需要在 Search Console 里验证过的站点）。**主页网址**：https://cossplay.vercel.app。**支持网址**：https://github.com/iamdin/cossplay/issues。

## 隐私标签

**单一用途**：

> Cossplay 从侧边栏编辑当前标签页网站的 CSS 主题变量（颜色、字体、圆角、阴影），让开发者能为 coss ui 或 shadcn 风格的站点试主题并导出。

**权限说明**：

| 权限 | 说明 |
|---|---|
| `sidePanel` | 编辑器是贴在所编辑页面旁边的侧边栏；点工具栏图标即打开。 |
| `storage` | 把每个站点的主题修改、开关、撤销历史和选中的 Google 字体样式表存在 `chrome.storage.local`，这样刷新后修改还在。不会同步，也不会上传。 |
| `tabs` | 侧边栏跟随自己窗口的当前标签（`tabs.query`、`tabs.onActivated`、`tabs.onUpdated`），读取 URL 以知道要加载哪个站点的主题，连接该标签的 content script 做消息和检查模式，并在其他页面上显示「请打开一个 HTTP(S) 网站」。 |
| `scripting` | 把编辑过的主题变量作为用户来源的样式表注入（`scripting.insertCSS` / `removeCSS`），从而压过站点自己的 CSS；并只为用户编辑过的站点注册一小段脚本（`scripting.registerContentScripts`），在恢复已存主题时最多把页面藏 1.5 秒，避免先闪一下原来的主题。 |
| 主机权限 `http://*/*`、`https://*/*` | 扩展的用途是编辑用户打开的任意站点的主题，域名无法事先列全，包括 localhost 和预发主机。content script 读取页面的 CSS 变量并应用用户的修改；注入 CSS 需要对该标签的主机访问；service worker 还要拉取页面的跨源样式表（页面的 CSSOM 读不到）来找出主题。用户没编辑过的站点上，扩展只读样式表，不改任何东西。 |

**远程代码**：否，我不使用远程代码。（service worker 把 CSS 文本和主题 JSON 当数据拉取：Google Fonts 样式表、用户粘贴进导入框的主题 URL，以及当前页面的样式表。不会拉取或执行 JavaScript。）

**数据使用**：所有数据类别都不勾选。主题修改只存在浏览器的本地扩展存储里，从不离开设备；页面样式表在本地读取，用来检测主题。仅有的网络请求是用户触发的，或页面本来就会发的：用户选中的字体的 Google Fonts CSS（`fonts.googleapis.com`，字体文件来自 `fonts.gstatic.com`）、用户填写的导入 URL，以及所访问页面自己的样式表。全部不带 cookie（`credentials: "omit"`）。

三项都确认：

- 我不向第三方出售或转移用户数据，已批准的用途除外。
- 我不把用户数据用于与本项单一用途无关的目的。
- 我不把用户数据用于信用评估或借贷。

**隐私政策网址**：https://cossplay.vercel.app/privacy

## 分发标签

免费、公开、所有地区。

## 提交

1. 用 Google 账号在 https://chrome.google.com/webstore/devconsole 注册为 Chrome 网上应用店开发者：支付一次性 5 美元费用，并在 **账户** 里验证联系邮箱。
2. **商品 → 新商品**，上传 `apps/extension/cossplay-v0.1.0.zip`（见安装包）。
3. 按本文件填写 **商品详情**、**隐私** 和 **分发**，并上传图片。先确认 https://cossplay.vercel.app/privacy 已经上线。
4. **提交审核**。可以保持「审核通过后自动发布」，或关掉它以便手动发布。
5. 更新时：提高版本、构建、打包，然后在该商品上 **安装包 → 上传新的安装包**，再提交一次。

## 审核时可能被问到的

- **宽泛的主机权限**（`http://*/*`、`https://*/*`，再加上所有站点上的 content script）会触发深入审核，耗时会明显长于普通审核。主机权限说明直接回答了这一点：单一用途是编辑用户打开的任意站点，域名事先未知；主机访问用来读取页面的 CSS 变量、注入编辑后的变量，并读取跨源样式表；不收集、也不发送任何东西。如果审核要求收窄访问，替代方案是 `activeTab` 加上按站点授予的可选主机权限，那样会失去在重新加载时于首次绘制前恢复已存主题；那是代码改动，不是上架文案的改动。
- **`tabs`**：有了全部 HTTP(S) 站点的主机权限，标签 URL 本来就能读到，审核人可能会问为什么还要 `tabs`。它额外的作用只是读取非 HTTP 标签的 URL（例如 `chrome://`），面板只用这个来说自己不能编辑它们。去掉 `tabs` 可以避开这个问题；那些标签的 URL 会读成空，面板仍会显示同一句提示。
- **远程资源**：会拉取并存储 Google Fonts CSS，但它是 CSS，不是代码，而且只针对用户选中的字体。
