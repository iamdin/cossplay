import path from "node:path"

const { chromium } =
  await import("/Users/dinq/GitHub/iamdin/cossplay/apps/extension/node_modules/@playwright/test/index.mjs")
const OUT = path.resolve(import.meta.dirname, "../assets/cap")
const b = await chromium.launch({ headless: true })
const p = await b.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
})

// 1. Capture Export Dialog with "Share link" button
console.log("Capturing Export dialog with Share link...")
await p.goto("https://cossplay.vercel.app/editor", { waitUntil: "networkidle" })
await p.addStyleTag({
  content: "::-webkit-scrollbar{width:0!important;height:0!important}",
})
await p.waitForTimeout(1000)

// Open Export dialog
const expBtn = p
  .locator(
    'button:has-text("Export"), button[aria-label*="Export" i], button[title*="Export" i]'
  )
  .first()
await expBtn.click()
await p.waitForTimeout(1000)
await p.screenshot({ path: path.join(OUT, "update-export-share.png") })

// 2. Click "Share link" to capture toast or action state
const shareBtn = p.getByRole("button", { name: "Share link" })
await shareBtn.click()
await p.waitForTimeout(600)
await p.screenshot({ path: path.join(OUT, "update-share-toast.png") })

// Close dialog
await p.keyboard.press("Escape")
await p.waitForTimeout(800)

// 3. Capture Inspector with Override Badge (⚡ .dark)
console.log("Capturing Inspector override tracing...")
// Inject a dark container with a button in main
await p.evaluate(() => {
  const main = document.querySelector("main")
  const container = document.createElement("div")
  container.className =
    "dark p-6 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl mb-6"
  container.innerHTML =
    '<div class="text-xs font-mono text-amber-400 mb-2 font-medium tracking-wide">CONTAINER (DARK OVERRIDE)</div><button id="cap-dark-btn" class="bg-primary text-primary-foreground font-medium px-5 py-2.5 rounded-lg shadow">Overridden Component</button>'
  main.prepend(container)
})

// Click Inspect button
const inspectBtn = p.getByRole("button", { name: "Inspect" })
await inspectBtn.click()
await p.waitForTimeout(600)

// Hover over the button
const btn = p.locator("#cap-dark-btn")
await btn.hover()
await p.waitForTimeout(1200)
await p.screenshot({ path: path.join(OUT, "update-inspector-override.png") })

// 4. Capture Shared URL instant theme loading
console.log("Capturing Shared Theme URL loading...")
const sharedUrl =
  "https://cossplay.vercel.app/editor#theme=z_q1YqUbJSys1PSS3K083NzMvMTcxR0lHKUbKqViooysxNLKpUslJSNjBLMksxUarVUUpBkzEySjFOTVWqrQUA"
await p.goto(sharedUrl, { waitUntil: "networkidle" })
await p.addStyleTag({
  content: "::-webkit-scrollbar{width:0!important;height:0!important}",
})
await p.waitForTimeout(1500)
await p.screenshot({ path: path.join(OUT, "update-shared-theme.png") })

await b.close()
console.log("All 2x captures completed!")
