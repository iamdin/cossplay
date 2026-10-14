# Cossplay

Cossplay 为 coss ui 设计和应用主题：在浏览器 Editor 里对着组件 Gallery，或通过 Chrome 扩展在真实的 coss ui 网站上实时进行。

## 用语

### 主题

**Theme**：
一套完整的 token 值，含浅色和深色模式。
_避免_：Style、skin、palette

**Token**：
一个具名的主题变量，例如 `primary`、`destructive-foreground` 或 `radius`，遵循 coss ui 的 token 集。
_避免_：Variable、CSS var

**Preset**：
来自 tweakcn 的现成主题，映射到 coss ui 的 token 上；或 coss ui 自己的默认主题。
_避免_：Template

**Override**：
与所套用主题不同的那个 token 值；只写出 override。
_避免_：Patch、diff

### 表面

**Editor**：
`/editor` 上的浏览器应用，布局像 tweakcn 的编辑器：左边是面板，右边是预览。不需要扩展。
_避免_：Playground、preview、demo

**Preview**：
Editor 里面板旁边的画布，显示一个实时接收主题的页面。
_避免_：Canvas、iframe、viewport

**Gallery**：
用真实 coss ui 组件做成的内置预览页（例如 Cards 或 Dashboard）。
_避免_：Sample site、demo page

**Custom preview**：
用户自己的应用（通常在 localhost）的预览，地址由用户填写，通过 Bridge 换主题。
_避免_：Live preview、external preview

**Bridge**：
开发者加到自己应用里的一段脚本，让 Editor 能在预览里给它换主题。
_避免_：Embed script、snippet

**Panel**：
Editor 和扩展里的编辑控件（预设、token、排版、历史、导入/导出）。两者的编辑能力相同，只有宿主不同。
_避免_：Side panel UI、sidebar

**Host**：
面板跑在什么里面——Editor 或扩展——由此决定主题应用到哪里、存在哪里。
_避免_：Adapter、platform、environment

**Extension**：
直接编辑线上 coss ui 站点的 Chrome 扩展，把面板放在 Chrome 的侧边栏里。它不是 Editor 预览的一部分。

**Site**：
一个线上网站，以其 origin 标识，扩展编辑的是它的主题。
_避免_：Page、tab、domain
