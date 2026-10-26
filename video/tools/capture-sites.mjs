// Captures several coss ui sites in the same presets for the opening montage: assets/cap/site-m{site}-{state}.png,
// state 0 = the site's own theme, 1..8 = PRESETS, with a d suffix in dark. Run: node tools/capture-sites.mjs (ONLY=<site index> for one site)
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
const { chromium } =
  await import("/Users/dinq/GitHub/iamdin/cossplay/apps/extension/node_modules/@playwright/test/index.mjs")
const OUT = path.resolve(import.meta.dirname, "../assets/cap")
const ext = "/Users/dinq/GitHub/iamdin/cossplay/apps/extension/dist"
const SITES = [
  "https://coss.com/ui",
  "https://coss.com/ui/chat",
  "https://coss.com",
  "https://coss.com/ui/particles",
]
const PRESETS = [
  "Cosmic Night",
  "Violet Bloom",
  "Catppuccin",
  "Bubblegum",
  "Kodama Grove",
  "Claymorphism",
  "Amethyst Haze",
  "Cyberpunk",
]
const [W, H, PANEL] = [1280, 800, 400]
const noBars = "::-webkit-scrollbar{width:0!important;height:0!important}"
const ctx = await chromium.launchPersistentContext(
  fs.mkdtempSync(path.join(os.tmpdir(), "cp-")),
  {
    headless: false,
    deviceScaleFactor: 2,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  }
)
const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent("serviceworker"))
const extId = sw.url().split("/")[2]
const site = await ctx.newPage()
await site.setViewportSize({ width: W, height: H })

for (const [s, url] of SITES.entries()) {
  if (process.env.ONLY && process.env.ONLY !== String(s)) continue
  await site.goto(url, { waitUntil: "networkidle" })
  await site.addStyleTag({ content: noBars })
  await site.waitForTimeout(800)
  await site.screenshot({ path: path.join(OUT, `site-m${s}-0.png`) })
  // A fresh panel per site, pointed at the site tab.
  const panel = await ctx.newPage()
  await panel.setViewportSize({ width: PANEL, height: H })
  await panel.addInitScript((u) => {
    const q = chrome.tabs.query.bind(chrome.tabs)
    chrome.tabs.query = (i) =>
      q(i.active && i.currentWindow ? { url: `${new URL(u).origin}/*` } : i)
  }, url)
  await panel.goto(`chrome-extension://${extId}/sidepanel.html`)
  const trigger = panel.getByRole("combobox", { name: "Theme preset" })
  await trigger.waitFor()
  await panel.waitForFunction(
    () => !document.querySelector('[aria-label="Theme preset"]:disabled')
  )
  await panel.waitForTimeout(800)
  for (const [i, name] of PRESETS.entries()) {
    await trigger.click()
    await panel.getByPlaceholder("Search presets…").fill(name)
    await panel.getByRole("option", { name, exact: true }).click()
    await site.waitForTimeout(900)
    await site.screenshot({ path: path.join(OUT, `site-m${s}-${i + 1}.png`) })
    await panel.getByRole("button", { name: "Preview dark" }).click()
    await site.waitForTimeout(900)
    await site.screenshot({ path: path.join(OUT, `site-m${s}-${i + 1}d.png`) })
    await panel.getByRole("button", { name: "Preview light" }).click()
  }
  await panel.close()
}
fs.writeFileSync(
  path.join(OUT, "montage.json"),
  JSON.stringify({ SITES, PRESETS })
)
await ctx.close()
console.log("done")
