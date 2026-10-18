// Captures the Chrome Web Store screenshots into docs/store/ with the built extension (dist)
// driving the live https://coss.com/ui. Each screenshot puts a real capture of the site next to
// a real capture of the side panel at its docked width; as in e2e, only the docking is stood in
// for (the panel's "active tab of its window" query returns the site's tab).
// Run from apps/extension after `pnpm build`: node scripts/store-screenshots.ts
// The landing editor shot (same Catppuccin preset as screenshot 3): node scripts/store-screenshots.ts --editor [url]
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { chromium } from "@playwright/test"

const SITE = "https://coss.com/ui"
const out = path.resolve(import.meta.dirname, "../../../docs/store")
const ext = path.resolve(import.meta.dirname, "../dist")
const [W, H, PANEL] = [1280, 800, 400]
// Classic scrollbars take layout width and leave a gutter in the 1280px frame.
const hideScrollbars =
  "::-webkit-scrollbar{width:0!important;height:0!important}"

// Homepage pair: the extension shot is screenshot-3; this is the browser editor beside it.
if (process.argv.includes("--editor")) {
  const flag = process.argv.indexOf("--editor")
  const url = process.argv[flag + 1]?.startsWith("http")
    ? process.argv[flag + 1]
    : "http://127.0.0.1:5173/editor"
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  })
  const page = await browser.newPage({ viewport: { width: W, height: H } })
  await page.goto(url, { waitUntil: "networkidle" })
  await page.addStyleTag({ content: hideScrollbars })
  const trigger = page.getByRole("combobox", { name: "Theme preset" })
  await trigger.waitFor()
  await page.waitForFunction(
    () => !document.querySelector('[aria-label="Theme preset"]:disabled')
  )
  await trigger.click()
  await page.getByPlaceholder("Search presets…").fill("Catppuccin")
  await page.getByRole("option", { name: "Catppuccin", exact: true }).click()
  await page.waitForTimeout(800)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({
    path: path.resolve(import.meta.dirname, "../../web/public/editor.png"),
  })
  await browser.close()
  process.exit(0)
}

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
await site.addStyleTag({ content: hideScrollbars })
// Opened before the panel: a tab activated later would become the panel's target.
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
await panel.addStyleTag({ content: hideScrollbars })
const trigger = panel.getByRole("combobox", { name: "Theme preset" })
await trigger.waitFor()
await panel.waitForFunction(
  () => !document.querySelector('[aria-label="Theme preset"]:disabled')
)

async function preset(name: string) {
  await trigger.click()
  await panel.getByPlaceholder("Search presets…").fill(name)
  await panel.getByRole("option", { name, exact: true }).click()
  await site.waitForTimeout(800)
}

/** Composes real captures of the site and the panel into one 1280x800 screenshot. */
async function shot(name: string) {
  const [left, right] = await Promise.all([
    site.screenshot(),
    panel.screenshot(),
  ])
  await frame.setContent(
    `<body style="margin:0;display:flex;background:#d4d4d8;gap:1px;overflow:hidden"><img style="display:block" src="data:image/png;base64,${left.toString("base64")}"><img style="display:block" src="data:image/png;base64,${right.toString("base64")}"></body>`
  )
  await frame.screenshot({ path: path.join(out, `${name}.png`) })
}

fs.mkdirSync(out, { recursive: true })

// 1. Presets: pick a preset and the site follows.
await preset("Tangerine")
await trigger.click()
await panel.waitForTimeout(300)
await panel
  .getByRole("option", { name: "Graphite" })
  .evaluate((option) => option.scrollIntoView())
await shot("screenshot-1-presets")
await panel.getByPlaceholder("Search presets…").press("Escape")

// 2. Dark mode with a token's channel sliders open.
await preset("Cosmic Night")
await panel.getByRole("button", { name: "Preview dark" }).click()
await site.waitForTimeout(800)
await panel.getByTitle("Channels & opacity").first().click()
await shot("screenshot-2-dark-channels")
await panel.keyboard.press("Escape")

// 3. Inspect: hover an element on the site to see and edit the tokens it uses.
await panel.getByRole("button", { name: "Preview light" }).click()
await preset("Catppuccin")
await panel.getByRole("button", { name: "Inspect" }).click()
await site.getByRole("link", { name: "Get started" }).hover()
await site.locator("cossplay-inspector .card").waitFor()
await shot("screenshot-3-inspect")
await panel.keyboard.press("Escape")

// 4. Export the edited theme.
await panel.getByRole("button", { name: "Export" }).click()
await panel.waitForTimeout(500)
await shot("screenshot-4-export")

// Promo tiles: the extension icon, name and tagline; the marquee shows screenshot 2.
const icon = `<img src="data:image/png;base64,${fs.readFileSync("public/icons/icon-128.png").toString("base64")}"`
const brand = (scale: number) =>
  `<div style="display:flex;align-items:center;gap:${12 * scale}px;margin-left:-${16 * scale}px">${icon} style="width:${96 * scale}px"><span style="font-size:${40 * scale}px;font-weight:700;letter-spacing:-0.02em">Cossplay</span></div>`
const tagline = "Live-edit coss ui themes on any website"
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
  `<div style="padding:0 40px">${brand(0.9)}<p style="font-size:22px;line-height:1.3;color:#52525b;margin:12px 0 0">${tagline}, from the side panel.</p></div>`
)
const preview = fs.readFileSync(
  path.join(out, "screenshot-2-dark-channels.png")
)
await promo(
  "promo-marquee-1400x560",
  1400,
  560,
  `<div style="width:460px;padding:0 0 0 72px;flex:none">${brand(1.1)}<p style="font-size:28px;line-height:1.3;color:#52525b;margin:20px 0 0">${tagline}. Presets, light and dark, export to CSS.</p></div><img style="width:736px;margin-left:auto;margin-right:72px;border-radius:12px;box-shadow:0 12px 40px #0003" src="data:image/png;base64,${preview.toString("base64")}">`
)

await ctx.close()
