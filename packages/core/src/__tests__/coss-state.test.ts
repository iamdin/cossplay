import assert from "node:assert/strict"
import {
  effective,
  fontsKey,
  newSite,
  readLocalThemes,
  readSite,
  type SiteState,
  siteKey,
  transition,
} from "../coss/site"
import { createStore, type KeyValue } from "../coss/store"
import {
  clone,
  defaults,
  presetOverrides,
  presets,
  type Theme,
} from "../coss/theme"

const origin = "https://a.test"
function memory(): KeyValue & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>()
  return {
    data,
    getItem: async (key) => structuredClone(data.get(key)),
    setItem: async (key, value) => {
      data.set(key, structuredClone(value))
    },
  }
}
const baselineWith = (primary: string): Theme => {
  const theme = clone(defaults)
  theme.light.primary = primary
  return theme
}

test("persisted state carries no document detection, so each document derives from its own baseline", () => {
  let state = newSite(origin)
  state = transition(
    state,
    { kind: "token", mode: "light", token: "radius", value: "1rem" },
    defaults
  )
  const hexPage = effective(baselineWith("#b91c1c"), state.current.overrides)
  const hslPage = effective(baselineWith("0 72% 42%"), state.current.overrides)
  assert.equal(hexPage.light.primary, "#b91c1c")
  assert.equal(hslPage.light.primary, "0 72% 42%")
  assert.equal(hslPage.light.radius, "1rem")
  assert.deepEqual(Object.keys(state).sort(), [
    "current",
    "enabled",
    "future",
    "origin",
    "past",
    "previewMode",
  ])
})

test("stored state drops unknown fields and unsafe values never reach injected CSS", () => {
  const legacy = {
    origin,
    enabled: true,
    previewMode: "dark",
    original: { detected: true, sources: [{ selector: ":root" }] },
    current: {
      theme: clone(defaults),
      overrides: {
        light: {
          primary: "#ff0000",
          radius: "1rem; } body { display: none",
          bogus: "1px",
        },
        dark: {},
      },
      themeId: "x",
      hsl: { hue: 0, saturation: 1, lightness: 1 },
      hslBase: null,
      sidebarSync: false,
    },
    past: [{ theme: clone(defaults), overrides: { light: {}, dark: {} } }],
    future: [],
  }
  const state = readSite(legacy, origin)!
  assert.equal("original" in state, false)
  assert.equal("theme" in state.current, false)
  assert.deepEqual(state.current.overrides, {
    light: { primary: "#ff0000" },
    dark: {},
  })
  assert.equal(state.past.length, 1)
  assert.equal(state.previewMode, "dark")
  assert.equal(readSite(legacy, "https://b.test"), null)
})

test("transitions own token, sidebar, HSL and reset invariants", () => {
  let state = newSite(origin)
  state = transition(
    state,
    { kind: "token", mode: "dark", token: "radius", value: "1rem" },
    defaults
  )
  assert.equal(
    state.current.overrides.light.radius,
    "1rem",
    "common tokens apply to both modes"
  )
  state = transition(state, { kind: "sidebar", mode: "light" }, defaults)
  assert.equal(state.current.overrides.light.sidebar, defaults.light.background)
  state = transition(
    state,
    { kind: "token", mode: "light", token: "background", value: "#123456" },
    defaults
  )
  assert.equal(state.current.overrides.light.sidebar, "#123456")
  state = transition(
    state,
    { kind: "hsl", hsl: { hue: 60, saturation: 1, lightness: 1 } },
    defaults
  )
  const once = state.current.overrides.light.primary
  state = transition(
    state,
    { kind: "hsl", hsl: { hue: 60, saturation: 1, lightness: 1 } },
    defaults
  )
  assert.equal(
    state.current.overrides.light.primary,
    once,
    "HSL adjusts from one checkpoint and does not compound"
  )
  state = transition(
    state,
    { kind: "hsl", hsl: { hue: 0, saturation: 1, lightness: 1 } },
    defaults
  )
  assert.equal(state.current.overrides.light.background, "#123456")
  state = transition(
    transition(state, { kind: "preview", mode: "dark" }, defaults),
    { kind: "reset" },
    defaults
  )
  assert.deepEqual(state.current.overrides, { light: {}, dark: {} })
  assert.equal(state.previewMode, null)
  assert.equal(
    transition(state, { kind: "undo" }, defaults).current.overrides.light
      .background,
    "#123456"
  )
})

test("two panels with stale views both keep their edits", async () => {
  const storage = memory(),
    store = createStore(storage)
  await Promise.all([
    store.edit(
      origin,
      { kind: "token", mode: "light", token: "primary", value: "#ff0000" },
      defaults,
      ""
    ),
    store.edit(
      origin,
      { kind: "token", mode: "light", token: "radius", value: "1rem" },
      defaults,
      ""
    ),
  ])
  const state = readSite(storage.data.get(siteKey(origin)), origin)!
  assert.deepEqual(state.current.overrides.light, {
    primary: "#ff0000",
    radius: "1rem",
  })
  assert.equal(state.past.length, 2)
})

test("continuous edits coalesce only when nothing else happened in between", async () => {
  const storage = memory(),
    store = createStore(storage)
  const token = (value: string, key: string, now: number) =>
    store.edit(
      origin,
      { kind: "token", mode: "light", token: "radius", value },
      defaults,
      key,
      now
    )
  await token("1rem", "light:radius", 0)
  let state = await token("2rem", "light:radius", 100)
  assert.equal(state.past.length, 1)
  await store.edit(
    origin,
    { kind: "token", mode: "light", token: "primary", value: "#ff0000" },
    defaults,
    "",
    150
  )
  state = await token("3rem", "light:radius", 200)
  assert.equal(state.past.length, 3)
  state = await token("4rem", "light:radius", 900)
  assert.equal(state.past.length, 4)
})

test("local theme operations apply to the latest collection", async () => {
  const storage = memory(),
    store = createStore(storage)
  const theme = clone(defaults)
  // Both panels loaded an empty list; neither sends its cached list.
  await store.themes({ kind: "add", name: "A", theme })
  const themes = await store.themes({ kind: "add", name: "B", theme })
  assert.deepEqual(
    themes.map((t) => t.name),
    ["A", "B"]
  )
  const renamed = await store.themes({
    kind: "rename",
    id: themes[0].id,
    name: "  A2 ",
  })
  assert.deepEqual(
    renamed.map((t) => t.name),
    ["A2", "B"]
  )
  assert.deepEqual(
    (await store.themes({ kind: "delete", id: themes[1].id })).map(
      (t) => t.name
    ),
    ["A2"]
  )
  await assert.rejects(
    store.themes({ kind: "rename", id: themes[0].id, name: " " }),
    /empty/
  )
  await assert.rejects(
    store.themes({
      kind: "add",
      name: "bad",
      theme: { light: {}, dark: {} } as Theme,
    }),
    /Invalid theme/
  )
})

test("fonts loaded from different tabs of one origin are merged", async () => {
  const storage = memory(),
    store = createStore(storage)
  await Promise.all([
    store.font(origin, "Inter", "a"),
    store.font(origin, "Lora", "b"),
  ])
  assert.deepEqual(storage.data.get(fontsKey(origin)), {
    Inter: "a",
    Lora: "b",
  })
  await assert.rejects(
    store.font("chrome://extensions", "Inter", "a"),
    /origin/
  )
})

test("invalid edits are rejected without writing", async () => {
  const storage = memory(),
    store = createStore(storage)
  await assert.rejects(
    store.edit(origin, { kind: "nope" } as never, defaults, ""),
    /Unknown edit/
  )
  await assert.rejects(
    store.edit(origin, { kind: "undo" }, { light: {}, dark: {} }, ""),
    /baseline/
  )
  await assert.rejects(
    store.edit("javascript:alert(1)", { kind: "undo" }, defaults, ""),
    /origin/
  )
  assert.equal(storage.data.size, 0)
  const state: SiteState = await store.edit(
    origin,
    { kind: "enabled", enabled: false },
    defaults,
    ""
  )
  assert.equal(state.enabled, false)
})

test("presets override only the tokens they define and keep coss-only tokens from the page", () => {
  const overrides = presetOverrides(Object.keys(presets)[0])
  assert.ok(overrides.light.primary && overrides.dark.primary)
  assert.equal("info" in overrides.light, false)
  assert.equal(overrides.dark["font-sans"], overrides.light["font-sans"])
  const page = baselineWith("oklch(0.5 0.2 30)")
  page.light.info = "#0000ff"
  const state = transition(
    newSite(origin),
    { kind: "theme", overrides, themeId: "x" },
    page
  )
  const theme = effective(page, state.current.overrides)
  assert.equal(theme.light.info, "#0000ff")
  assert.equal(theme.light.primary, overrides.light.primary)
  assert.equal(transition(state, { kind: "undo" }, page).current.themeId, "")
})

test("local themes without createdAt are kept", () => {
  const themes = readLocalThemes([{ id: "a", name: "A", theme: defaults }])
  assert.deepEqual(
    themes.map((t) => [t.id, t.createdAt]),
    [["a", ""]]
  )
})
