// Captures real states of the Cossplay extension driving https://coss.com/ui at 2x into assets/cap/.
// Run: node tools/capture.mjs (needs the built extension in ../cossplay/apps/extension/dist)
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
const { chromium } =
  await import("/Users/dinq/GitHub/iamdin/cossplay/apps/extension/node_modules/@playwright/test/index.mjs")
const OUT = path.resolve(import.meta.dirname, "../assets/cap")
const ext = "/Users/dinq/GitHub/iamdin/cossplay/apps/extension/dist"
const SITE = "https://coss.com/ui"
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
await site.goto(SITE, { waitUntil: "networkidle" })
await site.addStyleTag({ content: noBars })
const panel = await ctx.newPage()
await panel.setViewportSize({ width: PANEL, height: H })
await panel.addInitScript((url) => {
  const q = chrome.tabs.query.bind(chrome.tabs)
  chrome.tabs.query = (i) =>
    q(i.active && i.currentWindow ? { url: `${url}*` } : i)
}, SITE)
await panel.goto(`chrome-extension://${extId}/sidepanel.html`)
await panel.addStyleTag({ content: noBars })
const trigger = panel.getByRole("combobox", { name: "Theme preset" })
await trigger.waitFor()
await panel.waitForFunction(
  () => !document.querySelector('[aria-label="Theme preset"]:disabled')
)
await panel.waitForTimeout(1000)

const HOOK = process.env.HOOK ?? "Bubblegum"
const settle = () => site.waitForTimeout(900)
const shot = async (name, which = "both") => {
  if (which !== "panel")
    await site.screenshot({ path: path.join(OUT, `site-${name}.png`) })
  if (which !== "site")
    await panel.screenshot({ path: path.join(OUT, `panel-${name}.png`) })
}
async function preset(name) {
  await trigger.click()
  await panel.getByPlaceholder("Search presets…").fill(name)
  await panel.getByRole("option", { name, exact: true }).click()
  await settle()
}

// The site's own :root variables, for the "old way" beat.
const rootVars = await site.evaluate(() => {
  const out = []
  for (const sheet of document.styleSheets) {
    let rules
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    for (const r of rules)
      if (r.selectorText === ":root")
        for (const p of r.style)
          if (p.startsWith("--"))
            out.push([p, r.style.getPropertyValue(p).trim()])
  }
  return out
})
fs.writeFileSync(
  path.join(OUT, "root-vars.json"),
  JSON.stringify(rootVars, null, 1)
)

// ONLY=chat: the new Chat UI page in the payoff presets, then stop.
if (process.env.ONLY === "chat") {
  await site.goto(`${SITE}/chat`, { waitUntil: "networkidle" })
  await site.addStyleTag({ content: noBars })
  const names = [
    "Cosmic Night",
    "Violet Bloom",
    "Catppuccin",
    "Bubblegum",
    "Kodama Grove",
    "Claymorphism",
    "Amethyst Haze",
    "Cyberpunk",
  ]
  for (const [i, n] of names.entries()) {
    await preset(n)
    await shot(`chat-${i}`, "site")
  }
  fs.writeFileSync(path.join(OUT, "chat.json"), JSON.stringify(names))
  await ctx.close()
  process.exit(0)
}
await shot("default")
// Menu open with Tangerine in view.
await trigger.click()
await panel.waitForTimeout(400)
await panel
  .getByRole("option", { name: HOOK, exact: true })
  .evaluate((o) => o.scrollIntoView({ block: "center" }))
await panel.getByRole("option", { name: HOOK, exact: true }).hover()
await panel.waitForTimeout(300)
const box = await panel
  .getByRole("option", { name: HOOK, exact: true })
  .boundingBox()
fs.writeFileSync(path.join(OUT, "hook-option.json"), JSON.stringify(box))
await shot("menu", "panel")
await panel.getByRole("option", { name: HOOK, exact: true }).click()
await settle()
await shot("hook")
await preset("Tangerine")
await shot("tangerine")
for (const [name, sel] of Object.entries({
  inspect: "Inspect",
  dark: "Preview dark",
  next: "Next preset",
})) {
  const b = await panel.getByRole("button", { name: sel }).boundingBox()
  fs.writeFileSync(path.join(OUT, `btn-${name}.json`), JSON.stringify(b))
}
await panel.getByRole("button", { name: "Preview dark" }).click()
await settle()
await shot("tangerine-dark")
await panel.getByRole("button", { name: "Preview light" }).click()
await settle()

// Hue sweep on Primary.
await panel.getByRole("button", { name: "Primary channels" }).click()
await panel.waitForTimeout(400)
const hue = panel.getByLabel("Primary Hue", { exact: true })
fs.writeFileSync(
  path.join(OUT, "hue-slider.json"),
  JSON.stringify(await hue.boundingBox())
)
const h0 = Number(await hue.inputValue())
const steps = []
for (let i = 0; i <= 8; i++) {
  const v = Math.round((h0 + i * 25) % 360)
  await hue.fill(String(v))
  await site.waitForTimeout(500)
  await shot(`hue-${i}`)
  steps.push(v)
}
fs.writeFileSync(
  path.join(OUT, "hue-steps.json"),
  JSON.stringify({ h0, steps })
)
await panel.getByRole("button", { name: "Primary channels" }).click()

// Inspect the Get started button.
await panel.getByRole("button", { name: "Inspect" }).click()
await site.waitForTimeout(300)
const gs = site.getByRole("link", { name: "Get started" })
fs.writeFileSync(
  path.join(OUT, "get-started.json"),
  JSON.stringify(await gs.boundingBox())
)
await gs.hover()
await site.locator("cossplay-inspector .card").waitFor()
await site.waitForTimeout(500)
await shot("inspect")
await panel.keyboard.press("Escape")
await site.mouse.move(5, 5)
await site.waitForTimeout(300)

// Export.
fs.writeFileSync(
  path.join(OUT, "btn-export.json"),
  JSON.stringify(
    await panel.getByRole("button", { name: "Export" }).boundingBox()
  )
)
await panel.getByRole("button", { name: "Export" }).click()
await panel.waitForTimeout(800)
await shot("export", "panel")
await panel.keyboard.press("Escape")
await panel.waitForTimeout(300)

// Payoff: the site in many presets.
const payoff = [
  "Cosmic Night",
  "Violet Bloom",
  "Neo Brutalism",
  "Catppuccin",
  "Ocean Breeze",
  "Bubblegum",
  "Doom 64",
  "Kodama Grove",
  "Claymorphism",
  "Amethyst Haze",
  "Cyberpunk",
  "Mono",
]
for (const [i, n] of payoff.entries()) {
  await preset(n)
  await shot(`payoff-${i}`, "site")
}
fs.writeFileSync(path.join(OUT, "payoff.json"), JSON.stringify(payoff))
await ctx.close()
console.log("done", extId)
