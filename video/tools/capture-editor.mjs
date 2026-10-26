// Captures the web editor (Card gallery) at 2x, stepping presets with its Next button, into assets/cap/.
// Run: START="Ocean Breeze" node tools/capture-editor.mjs
import fs from "node:fs"
import path from "node:path"
const { chromium } =
  await import("/Users/dinq/GitHub/iamdin/cossplay/apps/extension/node_modules/@playwright/test/index.mjs")
const OUT = path.resolve(import.meta.dirname, "../assets/cap")
const START = process.env.START ?? "Ocean Breeze"
const b = await chromium.launch()
const p = await b.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
})
await p.goto("https://cossplay.vercel.app/editor", { waitUntil: "networkidle" })
await p.addStyleTag({
  content: "::-webkit-scrollbar{width:0!important;height:0!important}",
})
await p
  .getByText("Accordion", { exact: true })
  .locator("visible=true")
  .first()
  .click()
await p
  .locator("[role=option],[role=menuitem],[role=menuitemradio]")
  .filter({ hasText: /^Card$/ })
  .first()
  .click()
await p.getByRole("combobox", { name: "Theme preset" }).click()
await p.getByPlaceholder("Search presets…").fill(START)
await p.getByRole("option", { name: START, exact: true }).click()
await p.mouse.move(5, 5)
await p.waitForTimeout(1200)
const next = p.getByRole("button", { name: "Next preset" })
fs.writeFileSync(
  path.join(OUT, "editor-next.json"),
  JSON.stringify(await next.boundingBox())
)
const names = []
for (let i = 0; i < 4; i++) {
  if (i) {
    await next.click()
    await p.mouse.move(5, 5)
    await p.waitForTimeout(1200)
  }
  names.push(
    await p.getByRole("combobox", { name: "Theme preset" }).innerText()
  )
  await p.screenshot({ path: path.join(OUT, `editor-${i}.png`) })
}
fs.writeFileSync(path.join(OUT, "editor.json"), JSON.stringify(names))
await b.close()
console.log(names)
