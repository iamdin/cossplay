import path from "node:path"

const { chromium } =
  await import("/Users/dinq/GitHub/iamdin/cossplay/apps/extension/node_modules/@playwright/test/index.mjs")
const OUT = path.resolve(import.meta.dirname, "../assets/cap")
const b = await chromium.launch({ headless: true })
const p = await b.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
})

const marioUrl =
  "https://cossplay.vercel.app/editor#theme=z_vZDNTsMwEITfZXp10Dpu2uC3Wf9BRImjTSJaVXl35ABSFeihF-b4rUaz-q6YYCFxklyxeA4RCifYKwbp3lkusNjFpm5qDfXDqpQlvkie-1DOaQ0UxuhzH75LRNwS3dJ7NfY-9uWNXXKB1s4X2hR0q1vtoCAcunmEBQ3nMvDKIX9U7jTLluWUxjhVZ1iYP_jlFx_Yd1PB9GSwKISNipSMM_SgCrP3x-b5QRUpHIjvqaA1UHDs326wp6D3ZWiWxD6u1g76WBf2P9YaLMsn"

console.log("Navigating to Mario theme...")
await p.goto(marioUrl, { waitUntil: "networkidle" })
await p.addStyleTag({
  content: "::-webkit-scrollbar{width:0!important;height:0!important}",
})
await p.waitForTimeout(2000)

// Capture Mario Editor state
await p.screenshot({ path: path.join(OUT, "mario-editor.png") })

// Open Export dialog
const expBtn = p
  .locator(
    'button:has-text("Export"), button[aria-label*="Export" i], button[title*="Export" i]'
  )
  .first()
await expBtn.click()
await p.waitForTimeout(800)
await p.screenshot({ path: path.join(OUT, "mario-export.png") })

// Click Share link to show toast
const shareBtn = p.getByRole("button", { name: "Share link" })
await shareBtn.click()
await p.waitForTimeout(500)
await p.screenshot({ path: path.join(OUT, "mario-toast.png") })

await b.close()
console.log("Mario 2x screenshots captured!")
