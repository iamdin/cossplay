import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import {
  type BrowserContext,
  chromium,
  expect,
  type Page,
  test,
} from "@playwright/test"

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
  await expect(page.locator("#cossplay-theme")).toHaveCount(0)
})

test("inspect mode reports the picked token over the inspector port", async () => {
  const page = await ctx.newPage()
  await page.route("http://inspect.test/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: COSS_PAGE.replace(
        '<button id="cta">',
        '<button id="cta" class="bg-primary text-primary-foreground">'
      ),
    })
  )
  await page.goto("http://inspect.test/")
  const [sw] = ctx.serviceWorkers()
  // Stands in for the side panel, which connects the same way.
  await sw.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ url: "http://inspect.test/*" })
    const port = chrome.tabs.connect(tab.id!, { name: "cossplay-inspector" })
    const state = { picks: [] as string[], disconnected: false }
    port.onMessage.addListener(({ token }) => state.picks.push(token))
    port.onDisconnect.addListener(() => {
      state.disconnected = true
    })
    Object.assign(globalThis, { inspectorState: state })
  })
  const card = page.locator("cossplay-inspector .card")
  await expect(async () => {
    await page.locator("#cta").hover({ position: { x: 2, y: 2 } })
    await expect(card).toBeVisible({ timeout: 500 })
  }).toPass()
  // One row per token, with the classes that use it.
  await expect(card.getByRole("button")).toHaveText([
    "primarybg-primary",
    "primary-foregroundtext-primary-foreground",
  ])
  await card.getByTitle("Edit primary-foreground").click()
  const state = () =>
    sw.evaluate(
      () =>
        (
          globalThis as unknown as {
            inspectorState: { picks: string[]; disconnected: boolean }
          }
        ).inspectorState
    )
  await expect.poll(state).toEqual({
    picks: ["primary-foreground"],
    disconnected: false,
  })
  await page.keyboard.press("Escape")
  await expect(page.locator("cossplay-inspector")).toHaveCount(0)
  await expect.poll(state).toEqual({
    picks: ["primary-foreground"],
    disconnected: true,
  })
})

// The side panel at its docked width, driving a real tab. Only the docking is stood in for:
// the panel's "active tab of its window" query returns the site's tab.
test.describe("side panel", () => {
  let site: Page
  let panel: Page
  const errors: string[] = []
  const primary = () =>
    site.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim()
    )

  test.beforeAll(async () => {
    site = await ctx.newPage()
    await site.route("http://panel.test/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: COSS_PAGE.replace(
          '<button id="cta">',
          '<button id="cta" class="bg-primary text-primary-foreground">'
        ),
      })
    )
    await site.goto("http://panel.test/")
    panel = await ctx.newPage()
    await panel.setViewportSize({ width: 400, height: 900 })
    await panel.addInitScript(() => {
      const query = chrome.tabs.query.bind(chrome.tabs)
      chrome.tabs.query = ((info: chrome.tabs.QueryInfo) =>
        query(
          info.active && info.currentWindow
            ? { url: "http://panel.test/*" }
            : info
        )) as typeof chrome.tabs.query
    })
    panel.on("pageerror", (e) => errors.push(e.message))
    panel.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text())
    })
    await panel.goto(`chrome-extension://${extId}/sidepanel.html`)
  })
  test.afterEach(() => expect(errors).toEqual([]))

  test("preset picker and Tailwind palette theme the site", async () => {
    const trigger = panel.getByLabel("Theme preset")
    await expect(trigger).toBeEnabled({ timeout: 10_000 })
    const initial = await primary()
    await trigger.click()
    await panel.getByPlaceholder("Search presets…").fill("doom")
    await panel.getByRole("option", { name: "Doom 64" }).click()
    await expect(trigger).toContainText("Doom 64")
    await expect.poll(primary).not.toBe(initial)
    const preset = await primary()

    await panel
      .getByRole("button", { name: "Primary Tailwind colors", exact: true })
      .click()
    const red = panel.getByRole("button", { name: "red-500", exact: true })
    // The palette fits the panel.
    await expect
      .poll(async () => {
        const box = await red.boundingBox()
        return box ? box.x + box.width : Number.POSITIVE_INFINITY
      })
      .toBeLessThanOrEqual(400)
    await red.click()
    await panel.keyboard.press("Escape")
    await expect(trigger).toHaveText("Custom")
    await expect.poll(primary).not.toBe(preset)

    await panel.getByRole("button", { name: "Next preset" }).click()
    await expect(trigger).not.toHaveText("Custom")
  })

  test("an inspector pick on the site focuses the panel's control", async () => {
    const search = panel.getByLabel("Search colors")
    await search.fill("chart")
    const toggle = panel.getByRole("button", { name: "Inspect" })
    await toggle.click()
    await expect(toggle).toHaveAttribute("aria-pressed", "true")
    const card = site.locator("cossplay-inspector .card")
    await expect(async () => {
      await site.locator("#cta").hover({ position: { x: 2, y: 2 } })
      await expect(card).toBeVisible({ timeout: 500 })
    }).toPass()
    await card.getByTitle("Edit primary", { exact: true }).click()
    await expect(panel.locator('input[data-token="primary"]')).toBeFocused()
    await expect(search).toHaveValue("")

    await site.keyboard.press("Escape")
    await expect(site.locator("cossplay-inspector")).toHaveCount(0)
    await expect(toggle).toHaveAttribute("aria-pressed", "false")

    // Escape in the panel ends it as well.
    await toggle.click()
    await expect(site.locator("cossplay-inspector")).toHaveCount(1)
    await panel.keyboard.press("Escape")
    await expect(toggle).toHaveAttribute("aria-pressed", "false")
    await expect(site.locator("cossplay-inspector")).toHaveCount(0)
  })
})
