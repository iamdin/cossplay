// 用构建好的扩展（dist）驱动线上 https://coss.com/ui，把 Chrome 网上应用店截图抓到 docs/store/。
// 每张图把站点的真实截图和停靠宽度下侧边栏的真实截图拼在一起；和 e2e 一样，只模拟停靠
//（面板查询「自己窗口的当前标签」时返回站点标签）。
// 在 `pnpm build` 之后于 apps/extension 运行：node scripts/store-screenshots.ts
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { chromium } from "@playwright/test"

const SITE = "https://coss.com/ui"
const out = path.resolve(import.meta.dirname, "../../../docs/store")
const ext = path.resolve(import.meta.dirname, "../dist")
const [W, H, PANEL] = [1280, 800, 400]

const ctx = await chromium.launchPersistentContext(
  fs.mkdtempSync(path.join(os.tmpdir(), "cossplay-store-")),
  {
    headless: false,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  }
)
const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent("serviceworker"))
const extId = sw.url().split("/")[2]

const site = await ctx.newPage()
await site.setViewportSize({ width: W - PANEL - 1, height: H })
await site.goto(SITE, { waitUntil: "networkidle" })
// 在面板之前打开：之后激活的标签会变成面板的目标。
const frame = await ctx.newPage()
await frame.setViewportSize({ width: W, height: H })
const panel = await ctx.newPage()
await panel.setViewportSize({ width: PANEL, height: H })
await panel.addInitScript((url) => {
  const query = chrome.tabs.query.bind(chrome.tabs)
  chrome.tabs.query = ((info: chrome.tabs.QueryInfo) =>
    query(
      info.active && info.currentWindow ? { url: `${url}*` } : info
    )) as typeof chrome.tabs.query
}, SITE)
await panel.goto(`chrome-extension://${extId}/sidepanel.html`)
const trigger = panel.getByRole("combobox", { name: "主题预设" })
await trigger.waitFor()
await panel.waitForFunction(
  () => !document.querySelector('[aria-label="主题预设"]:disabled')
)

async function preset(name: string) {
  await trigger.click()
  await panel.getByPlaceholder("搜索预设…").fill(name)
  await panel.getByRole("option", { name, exact: true }).click()
  await site.waitForTimeout(800)
}

/** 把站点和面板的真实截图合成一张 1280x800。 */
async function shot(name: string) {
  const [left, right] = await Promise.all([
    site.screenshot(),
    panel.screenshot(),
  ])
  await frame.setContent(
    `<body style="margin:0;display:flex;background:#d4d4d8;gap:1px"><img src="data:image/png;base64,${left.toString("base64")}"><img src="data:image/png;base64,${right.toString("base64")}"></body>`
  )
  await frame.screenshot({ path: path.join(out, `${name}.png`) })
}

fs.mkdirSync(out, { recursive: true })

// 1. 预设：选一个预设，站点跟着变。
await preset("Tangerine")
await trigger.click()
await panel.waitForTimeout(300)
await panel
  .getByRole("option", { name: "Graphite" })
  .evaluate((option) => option.scrollIntoView())
await shot("screenshot-1-presets")
await panel.getByPlaceholder("搜索预设…").press("Escape")

// 2. 深色模式，并打开某个 token 的通道滑杆。
await preset("Cosmic Night")
await panel.getByRole("button", { name: "预览深色" }).click()
await site.waitForTimeout(800)
await panel.getByTitle("通道与不透明度").first().click()
await shot("screenshot-2-dark-channels")
await panel.keyboard.press("Escape")

// 3. 检查：在站点上悬停元素，查看并编辑它用到的 token。
await panel.getByRole("button", { name: "预览浅色" }).click()
await preset("Ocean Breeze")
await panel.getByRole("button", { name: "检查" }).click()
await site.getByRole("link", { name: "Get started" }).hover()
await site.locator("cossplay-inspector .card").waitFor()
await shot("screenshot-3-inspect")
await panel.keyboard.press("Escape")

// 4. 导出编辑过的主题。
await panel.getByRole("button", { name: "导出" }).click()
await panel.waitForTimeout(500)
await shot("screenshot-4-export")

// 宣传图：扩展图标、名称和标语；横幅用截图 2。
const icon = `<img src="data:image/png;base64,${fs.readFileSync("public/icons/icon-128.png").toString("base64")}"`
const brand = (scale: number) =>
  `<div style="display:flex;align-items:center;gap:${12 * scale}px;margin-left:-${16 * scale}px">${icon} style="width:${96 * scale}px"><span style="font-size:${40 * scale}px;font-weight:700;letter-spacing:-0.02em">Cossplay</span></div>`
const tagline = "在任意网站上实时编辑 coss ui 主题"
async function promo(
  name: string,
  width: number,
  height: number,
  body: string
) {
  await frame.setViewportSize({ width, height })
  await frame.setContent(
    `<body style="margin:0;height:100vh;box-sizing:border-box;background:#fafafa;color:#171717;font-family:system-ui,sans-serif;display:flex;align-items:center">${body}</body>`
  )
  await frame.screenshot({ path: path.join(out, `${name}.png`) })
}
await promo(
  "promo-small-440x280",
  440,
  280,
  `<div style="padding:0 40px">${brand(0.9)}<p style="font-size:22px;line-height:1.3;color:#52525b;margin:12px 0 0">${tagline}，就在侧边栏里。</p></div>`
)
const preview = fs.readFileSync(
  path.join(out, "screenshot-2-dark-channels.png")
)
await promo(
  "promo-marquee-1400x560",
  1400,
  560,
  `<div style="width:460px;padding:0 0 0 72px;flex:none">${brand(1.1)}<p style="font-size:28px;line-height:1.3;color:#52525b;margin:20px 0 0">${tagline}。预设、浅色与深色，导出为 CSS。</p></div><img style="width:736px;margin-left:auto;margin-right:72px;border-radius:12px;box-shadow:0 12px 40px #0003" src="data:image/png;base64,${preview.toString("base64")}">`
)

await ctx.close()
