# Editor 只预览自己的 Gallery 和带 Bridge 的应用，从不预览 coss.com

网页 Editor 的 Preview 只显示我们的 Gallery（用真实 coss ui 组件搭建）以及包含 Bridge 脚本的应用的自定义预览，例如开发者的 localhost。它不嵌入 coss.com/ui：浏览器不允许一个页面去给跨源框架上样式，所以要给 coss.com 换主题，只能把它代理到我们的域名（等于用我们的名字重新发布别人的站点），或者要求安装扩展。编辑 coss.com 这类线上站点是 Extension 的事，通过 Chrome 的侧边栏。

## 考虑过的方案

- **把 coss.com 代理到我们的域名并注入 Bridge**：否决。这等于用我们的名字提供 coss 的页面，需要他们同意，而且他们的站点一变就会坏。
- **用扩展当任意被嵌入站点的 Bridge**：目前否决。这会把网页 Editor 的主预览绑到一次安装上，而侧边栏已经覆盖了线上站点。
