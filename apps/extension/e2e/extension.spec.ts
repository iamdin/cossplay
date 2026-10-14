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

// 一个 coss 风格的页面：颜色通过 var()、color-mix() 和 --alpha() 的输出声明。
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
    // @webext-core/messaging 的线上格式：进来是 { type, id, timestamp }，出去是 { res } 或 { err }。
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
  // 按页面自己的格式写回（这里是 oklch）：#ff0000 是 oklch(0.628 0.258 29.23)。
  await expect(cta).toHaveCSS(
    "background-color",
    /^oklch\(0\.62\d* 0\.25\d* 29\.2\d*\)$/
  )
  await expect(cta).toHaveCSS("border-radius", "16px")
  // 组件作用域的任意属性保持自己的值。
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
  // 代替侧边栏，连接方式和它一样。
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
  // 每个 token 一行，带上用到它的 class。
  await expect(card.getByRole("button")).toHaveText([
    "primarybg-primary",
    "primary-foregroundtext-primary-foreground",
  ])
  await card.getByTitle("编辑 primary-foreground").click()
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

// 侧边栏按停靠宽度驱动一个真实标签。只模拟停靠：
// 面板查询「自己窗口的当前标签」时返回站点标签。
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
    const trigger = panel.getByLabel("主题预设")
    await expect(trigger).toBeEnabled({ timeout: 10_000 })
    const initial = await primary()
    await trigger.click()
    await panel.getByPlaceholder("搜索预设…").fill("doom")
    await panel.getByRole("option", { name: "Doom 64" }).click()
    await expect(trigger).toContainText("Doom 64")
    await expect.poll(primary).not.toBe(initial)
    const preset = await primary()

    await panel
      .getByRole("button", { name: "Primary Tailwind 色板", exact: true })
      .click()
    const red = panel.getByRole("button", { name: "red-500", exact: true })
    // 色板要放得进面板。
    await expect
      .poll(async () => {
        const box = await red.boundingBox()
        return box ? box.x + box.width : Number.POSITIVE_INFINITY
      })
      .toBeLessThanOrEqual(400)
    await red.click()
    await panel.keyboard.press("Escape")
    await expect(trigger).toHaveText("自定义")
    await expect.poll(primary).not.toBe(preset)

    await panel.getByRole("button", { name: "下一个预设" }).click()
    await expect(trigger).not.toHaveText("自定义")
  })

  test("an inspector pick on the site focuses the panel's control", async () => {
    const search = panel.getByLabel("搜索颜色")
    await search.fill("chart")
    const toggle = panel.getByRole("button", { name: "检查" })
    await toggle.click()
    await expect(toggle).toHaveAttribute("aria-pressed", "true")
    const card = site.locator("cossplay-inspector .card")
    await expect(async () => {
      await site.locator("#cta").hover({ position: { x: 2, y: 2 } })
      await expect(card).toBeVisible({ timeout: 500 })
    }).toPass()
    await card.getByTitle("编辑 primary", { exact: true }).click()
    await expect(panel.locator('input[data-token="primary"]')).toBeFocused()
    await expect(search).toHaveValue("")

    await site.keyboard.press("Escape")
    await expect(site.locator("cossplay-inspector")).toHaveCount(0)
    await expect(toggle).toHaveAttribute("aria-pressed", "false")

    // 在面板里按 Escape 也会结束。
    await toggle.click()
    await expect(site.locator("cossplay-inspector")).toHaveCount(1)
    await panel.keyboard.press("Escape")
    await expect(toggle).toHaveAttribute("aria-pressed", "false")
    await expect(site.locator("cossplay-inspector")).toHaveCount(0)
  })
})
