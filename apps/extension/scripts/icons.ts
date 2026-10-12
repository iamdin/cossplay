// Renders public/icons/icon-*.png from the site's favicon (apps/web/src/routes/__root.tsx).
// Run from apps/extension: node scripts/icons.ts
import fs from "node:fs"
import { chromium } from "@playwright/test"

const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#171717"/><circle cx="16" cy="16" r="7" fill="none" stroke="#fafafa" stroke-width="3"/></svg>`
// Chrome's guidance for the 128px icon: 96px artwork inside 16px of transparent padding.
const artwork = { 16: 16, 32: 32, 48: 48, 128: 96 }

const browser = await chromium.launch()
const page = await browser.newPage()
fs.mkdirSync("public/icons", { recursive: true })
for (const [size, art] of Object.entries(artwork)) {
  await page.setViewportSize({ width: +size, height: +size })
  await page.setContent(
    `<body style="margin:0;display:grid;place-items:center;height:100vh"><div style="width:${art}px;height:${art}px">${logo}</div></body>`
  )
  await page.screenshot({
    path: `public/icons/icon-${size}.png`,
    omitBackground: true,
  })
}
await browser.close()
