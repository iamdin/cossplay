import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { type BrowserContext, chromium, expect, test } from "@playwright/test"

const extPath = path.resolve(import.meta.dirname, "../dist")
let ctx: BrowserContext
let extId: string

test.beforeAll(async () => {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "coss-ext-"))
  ctx = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
      "--no-sandbox",
    ],
  })
  let [sw] = ctx.serviceWorkers()
  if (!sw) sw = await ctx.waitForEvent("serviceworker")
  extId = sw.url().split("/")[2]
})

test.afterAll(async () => {
  await ctx?.close()
})

test("panel page renders", async () => {
  const page = await ctx.newPage()
  await page.goto(`chrome-extension://${extId}/sidepanel.html`)
  await expect(page.getByRole("tab", { name: "Colors" })).toBeVisible()
})

// A coss-style page: colors declared through var(), color-mix() and --alpha() output.
const COSS_PAGE = `<!doctype html><html><head><style>
:root { --color-white: #fff; --color-neutral-800: oklch(26.9% 0 0); --radius: 0.625rem;
  --background: var(--color-white); --foreground: var(--color-neutral-800); --primary: var(--color-neutral-800);
  --border: color-mix(in oklab, #000 8%, transparent); --success: oklch(69.6% 0.17 162.48); }
.dark { --background: color-mix(in srgb, oklch(14.5% 0 0) 96%, var(--color-white)); --primary: oklch(97% 0 0); }
button, span { background: var(--primary); border-radius: var(--radius); }
.\\[--radius\\:9999px\\] { --radius: 9999px; }
</style></head><body><button id="cta">coss</button><span id="pill" class="[--radius:9999px]">pill</span></body></html>`

test("detects coss variables and applies stored per-origin overrides", async () => {
  const page = await ctx.newPage()
  await page.route("http://coss.test/**", (route) =>
    route.fulfill({ contentType: "text/html", body: COSS_PAGE })
  )
  await page.goto("http://coss.test/")
  const [sw] = ctx.serviceWorkers()

  const detection = await sw.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ url: "http://coss.test/*" })
    // @webext-core/messaging wire format: { type, id, timestamp } in, { res } or { err } out.
    return (
      await chrome.tabs.sendMessage(tab.id!, {
        type: "inspect",
        id: 0,
        timestamp: Date.now(),
      })
    ).res.detection
  })
  expect(detection.detected).toBe(true)
  expect(detection.theme.light.border).toMatch(/0\.08\)$/)
  expect(detection.theme.light.success).toBe("oklch(69.6% 0.17 162.48)")
  expect(detection.theme.dark.primary).toBe("oklch(97% 0 0)")

  await sw.evaluate(() =>
    chrome.storage.local.set({
      "site:http://coss.test": {
        origin: "http://coss.test",
        enabled: true,
        previewMode: null,
        current: {
          overrides: {
            light: { primary: "#ff0000", radius: "1rem" },
            dark: { radius: "1rem" },
          },
        },
        past: [],
        future: [],
      },
    })
  )
  const cta = page.locator("#cta")
  // Written back in the page's own format (oklch here): #ff0000 is oklch(0.628 0.258 29.23).
  await expect(cta).toHaveCSS(
    "background-color",
    /^oklch\(0\.62\d* 0\.25\d* 29\.2\d*\)$/
  )
  await expect(cta).toHaveCSS("border-radius", "16px")
  // Component-scoped arbitrary properties keep their own value.
  await expect(page.locator("#pill")).toHaveCSS("border-radius", "9999px")

  await sw.evaluate(() =>
    chrome.storage.local.set({
      "site:http://coss.test": {
        origin: "http://coss.test",
        enabled: false,
        current: {},
        past: [],
        future: [],
      },
    })
  )
  await expect(cta).toHaveCSS("border-radius", "10px")
  await expect(page.locator("#coss-tweak-theme")).toHaveCount(0)
})
