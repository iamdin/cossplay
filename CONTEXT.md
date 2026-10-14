# Cossplay

Cossplay 为 coss ui 设计和应用主题：在浏览器里的编辑器对着组件图库，或通过 Chrome 扩展在真实的 coss ui 网站上实时进行。

## 用语

### 主题

**主题（Theme）**：
一套完整的令牌值，含浅色和深色模式。
_避免_：Style、skin、palette

**令牌（Token）**：
一个具名的主题变量，例如 `primary`、`destructive-foreground` 或 `radius`，遵循 coss ui 的令牌集。
_避免_：Variable、CSS var

**预设（Preset）**：
来自 tweakcn 的现成主题，映射到 coss ui 的令牌上；或 coss ui 自己的默认主题。
_避免_：Template

**覆盖（Override）**：
与所套用主题不同的那个令牌值；只写出覆盖。
_避免_：Patch、diff

### 表面

**编辑器（Editor）**：
`/editor` 上的浏览器应用，布局像 tweakcn 的编辑器：左边是面板，右边是预览。不需要扩展。
_避免_：Playground、preview、demo

**预览（Preview）**：
编辑器里面板旁边的画布，显示一个实时接收主题的页面。
_避免_：Canvas、iframe、viewport

**图库（Gallery）**：
用真实 coss ui 组件做成的内置预览页（例如卡片或仪表盘）。
_避免_：Sample site、demo page

**自定义预览（Custom preview）**：
用户自己的应用（通常在 localhost）的预览，地址由用户填写，通过桥接换主题。
_避免_：Live preview、external preview

**桥接（Bridge）**：
开发者加到自己应用里的一段脚本，让编辑器能在预览里给它换主题。
_避免_：Embed script、snippet

**面板（Panel）**：
编辑器和扩展里的编辑控件（预设、令牌、排版、历史、导入/导出）。两者的编辑能力相同，只有宿主不同。
_避免_：Side panel UI、sidebar

**宿主（Host）**：
面板跑在什么里面——编辑器或扩展——由此决定主题应用到哪里、存在哪里。
_避免_：Adapter、platform、environment

**扩展（Extension）**：
直接编辑线上 coss ui 站点的 Chrome 扩展，把面板放在 Chrome 的侧边栏里。它不是编辑器预览的一部分。

**站点（Site）**：
一个线上网站，以其 origin 标识，扩展编辑的是它的主题。
_避免_：Page、tab、domain
