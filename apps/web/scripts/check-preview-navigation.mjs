// Run: pnpm --filter @cossplay/web dev --host 127.0.0.1 --port 4187 --strictPort
// Then: ego-browser nodejs < apps/web/scripts/check-preview-navigation.mjs
// Browser measurement seam: the web app has no browser-test runner; extension E2E never renders this route.
const { default: assert } = await import("node:assert/strict")
const task = await taskSpace("editor-toolbar-regression")
const page = task.page("p1")
const list = '[role="tablist"][aria-label="Preview"]'
const trigger =
  '[role="group"][aria-label="Preview navigation"] [data-slot="menu-trigger"]'
const tab = (label) =>
  `${list} [role="tab"]:nth-of-type(${["Custom", "Typography", "Color Palette"].indexOf(label) + 1})`
const measure = async (label) => {
  await page.waitForFunction(() => {
    const selected = document.querySelector(
      '[aria-label="Preview"] [aria-selected="true"]'
    )
    if (!selected) return true
    const tabBounds = selected.getBoundingClientRect()
    const indicator = document
      .querySelector('[aria-label="Preview"] [data-slot="tab-indicator"]')
      .getBoundingClientRect()
    return (
      Math.abs(indicator.left - tabBounds.left) < 0.5 &&
      Math.abs(indicator.width - tabBounds.width) < 0.5
    )
  })
  const result = await page.evaluate(() => {
    const tabs = document.querySelector(
      '[role="tablist"][aria-label="Preview"]'
    )
    const group = tabs.closest(
      '[role="group"][aria-label="Preview navigation"]'
    )
    const menu = (group ?? tabs.parentElement).querySelector(
      '[data-slot="menu-trigger"]'
    )
    const bounds = (el) => {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      const range = document.createRange()
      range.selectNodeContents(
        el.querySelector("span.grid > span:last-child") ?? el
      )
      const text = range.getBoundingClientRect()
      return {
        textCenter: (text.top + text.bottom) / 2,
        top: r.top,
        bottom: r.bottom,
        height: r.height,
        padding: s.padding,
        border: s.borderWidth,
      }
    }
    return {
      group: Boolean(group),
      groupHeight: group?.getBoundingClientRect().height,
      commonBackground: group ? getComputedStyle(group).backgroundColor : null,
      menu: bounds(menu),
      tabs: [...tabs.querySelectorAll('[role="tab"]')].map(bounds),
      nestedBackground: getComputedStyle(tabs).backgroundColor,
      nestedPadding: getComputedStyle(tabs).padding,
      menuInTablist: tabs.contains(menu),
      active:
        Number(menu.hasAttribute("data-active")) +
        tabs.querySelectorAll('[aria-selected="true"]').length,
      overflow: group ? group.scrollWidth > group.clientWidth : false,
    }
  })
  console.log(label, JSON.stringify(result))
  assert(result.group, "Menu and tabs must share one visual navigation group")
  assert(!result.menuInTablist, "Menu button must not become a tab")
  assert.notEqual(result.commonBackground, "rgba(0, 0, 0, 0)")
  assert.equal(result.nestedBackground, "rgba(0, 0, 0, 0)")
  assert.equal(result.nestedPadding, "0px")
  assert.equal(result.active, 1, "Exactly one segment must look active")
  for (const t of result.tabs) {
    for (const key of ["height", "top", "bottom", "textCenter"]) {
      assert(
        Math.abs(t[key] - result.menu[key]) < 0.5,
        `${label}: mismatched ${key}`
      )
    }
    assert.equal(t.border, result.menu.border)
    assert.equal(t.padding, result.menu.padding)
  }
}

// A dedicated port avoids the normal editor's saved theme and panel width.
await page.goto("http://127.0.0.1:4187/editor")
await page.waitForSelector(list)
for (const width of [1440, 768, 390]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await page.reload()
  await page.waitForSelector(list)
  await page.waitForFunction(
    () =>
      document.querySelector('main [role="status"]')?.textContent ===
      "Saved locally"
  )
  await page.evaluate(() => document.fonts.ready)
  await measure(`${width}: initial category`)
  // The unchanged editor sidebar leaves less than a control width at phone sizes.
  if (width < 640) await page.click('button[aria-label="Fullscreen"]')
  await page.focus(trigger)
  await page.keyboard.press("Enter")
  await page.waitForSelector('[role="menu"]')
  await page.keyboard.press("Escape")
  await page.waitForSelector('[role="menu"]', { state: "hidden" })
  assert(
    await page.evaluate(
      (selector) => document.activeElement.matches(selector),
      trigger
    )
  )
  await page.keyboard.press("ArrowDown")
  await page.waitForSelector('[role="menu"]')
  const longest = await page.evaluate(
    () =>
      [...document.querySelectorAll('[role="menuitemradio"]')]
        .map((el) => el.textContent.trim())
        .sort((a, b) => b.length - a.length)[0]
  )
  await page.click(`loc=role:menuitemradio[name="${longest}"]`)
  await page.waitForSelector('[role="menu"]', { state: "hidden" })
  assert.equal(
    await page.evaluate(
      (selector) => document.querySelector(selector).getAttribute("aria-label"),
      trigger
    ),
    longest
  )
  await measure(`${width}: longest category (${longest})`)
  await page.focus(trigger)
  await page.keyboard.press("ArrowDown")
  await page.waitForSelector('[role="menuitemradio"][aria-checked="true"]')
  await page.waitForFunction(
    () => document.activeElement.getAttribute("role") === "menuitemradio"
  )
  const lastCategory = await page.evaluate(() =>
    [...document.querySelectorAll('[role="menuitemradio"]')]
      .at(-1)
      .textContent.trim()
  )
  await page.keyboard.press("End")
  await page.waitForFunction(
    (label) =>
      document
        .querySelector('[role="menuitemradio"][data-highlighted]')
        ?.textContent.trim() === label,
    lastCategory
  )
  await page.keyboard.press("Enter")
  await page.waitForSelector('[role="menu"]', { state: "hidden" })
  assert.equal(
    await page.evaluate(
      (selector) => document.querySelector(selector).getAttribute("aria-label"),
      trigger
    ),
    lastCategory
  )
  await page.click(tab("Custom"))
  await measure(`${width}: Custom / resting Particles`)
  await page.focus(tab("Custom"))
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Enter")
  await page.waitForSelector(`${tab("Typography")}[aria-selected="true"]`)
  await measure(`${width}: keyboard Typography`)
  const focused = await page.evaluate(() => {
    const el = document.activeElement
    const r = el.getBoundingClientRect()
    const group = el.closest('[role="group"][aria-label="Preview navigation"]')
    const g = group.getBoundingClientRect()
    return {
      ring: getComputedStyle(el).boxShadow,
      visible:
        r.left - 2 >= g.left &&
        r.right + 2 <= g.right &&
        r.top - 2 >= g.top &&
        r.bottom + 2 <= g.bottom,
    }
  })
  assert(
    focused.visible,
    "Keyboard focus must scroll into view without clipping the control"
  )
  assert.notEqual(
    focused.ring,
    "none",
    "Keyboard focus ring must remain visible"
  )
  await page.keyboard.press("End")
  await page.keyboard.press("Enter")
  await page.waitForSelector(`${tab("Color Palette")}[aria-selected="true"]`)
  await measure(`${width}: Color Palette`)
  await page.waitForFunction(() => {
    const el = document.activeElement
    const r = el.getBoundingClientRect()
    const g = el
      .closest('[aria-label="Preview navigation"]')
      .getBoundingClientRect()
    return r.left - 2 >= g.left && r.right + 2 <= g.right
  })
  if (width === 390)
    console.log(
      await page.screenshot({
        path: "/tmp/cossplay-preview-navigation-390-selected.png",
      })
    )
  if (width < 640) await page.click('button[aria-label="Exit fullscreen"]')
  await page.click('button[aria-label="Fullscreen"]')
  await page.waitForSelector('button[aria-label="Exit fullscreen"]')
  await measure(`${width}: fullscreen`)
  console.log(
    await page.screenshot({
      path: `/tmp/cossplay-preview-navigation-${width}-fullscreen.png`,
    })
  )
  await page.keyboard.press("Escape")
  await page.waitForSelector('button[aria-label="Fullscreen"]')
  if (width >= 640) await page.focus(trigger)
  console.log(
    await page.screenshot({
      path: `/tmp/cossplay-preview-navigation-${width}.png`,
    })
  )
}
await task.finish({ keep: [] })
console.log(
  "PASS: preview navigation geometry, selection, keyboard, scrolling and fullscreen"
)
