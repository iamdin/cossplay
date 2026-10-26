import assert from "node:assert/strict"
import { converter } from "culori"
import { contrast, formatColor, parseColor, sourceFormat } from "../coss/colors"
import { importTheme } from "../coss/import"
import {
  adjustTheme,
  clone,
  colorTokens,
  contrastPairs,
  decodeThemeHash,
  defaults,
  encodeThemeHash,
  exportCss,
  exportLayout,
  importOverrides,
  presetOverrides,
  presets,
  registryTheme,
  themeCss,
  tokens,
  validValue,
  variables,
} from "../coss/theme"

function equivalent(a: string, b: string, tolerance = 0.002) {
  const rgb = converter("rgb")
  const x = rgb(parseColor(a))!,
    y = rgb(parseColor(b))!
  for (const key of ["r", "g", "b"] as const)
    assert.ok(Math.abs(x[key] - y[key]) < tolerance, `${a} ≠ ${b} (${key})`)
  assert.ok(
    Math.abs((x.alpha ?? 1) - (y.alpha ?? 1)) < 0.005,
    `${a} ≠ ${b} (alpha)`
  )
}

test("the token set is coss ui globals.css plus tweakcn's shared fields", () => {
  assert.equal(colorTokens.length, 42)
  assert.ok(colorTokens.includes("shadow-color"))
  for (const key of [
    "info",
    "success-foreground",
    "warning",
    "code",
    "code-highlight",
    "destructive-foreground",
  ] as const)
    assert.ok(colorTokens.includes(key), key)
  assert.deepEqual(
    tokens.filter((k) => !colorTokens.includes(k as never)),
    [
      "font-sans",
      "font-serif",
      "font-mono",
      "radius",
      "shadow-opacity",
      "shadow-blur",
      "shadow-spread",
      "shadow-offset-x",
      "shadow-offset-y",
      "letter-spacing",
      "spacing",
    ]
  )
  assert.equal(defaults.light.radius, "0.625rem")
  for (const mode of ["light", "dark"] as const)
    for (const key of tokens)
      assert.ok(validValue(key, defaults[mode][key]), `${mode}.${key}`)
  assert.equal(parseColor(defaults.light.border)?.alpha, 0.08)
  for (const pair of contrastPairs)
    assert.ok(
      tokens.includes(pair.foreground) && tokens.includes(pair.background),
      pair.label
    )
})

test("every built-in preset converts to valid overrides", () => {
  for (const id of Object.keys(presets)) {
    const overrides = presetOverrides(id)
    for (const mode of ["light", "dark"] as const)
      for (const [key, value] of Object.entries(overrides[mode]))
        assert.ok(validValue(key as never, value), `${id}.${mode}.${key}`)
    assert.ok(Object.keys(overrides.light).length >= 32, id)
  }
})

test("shadcn themes map onto coss token semantics", () => {
  const { styles } = presets.catppuccin
  const overrides = presetOverrides("catppuccin")
  for (const mode of ["light", "dark"] as const) {
    const oklch = converter("oklch")
    const fg = oklch(parseColor(overrides[mode]["destructive-foreground"]!))!
    assert.ok(
      Math.abs(
        fg.l - oklch(parseColor(defaults[mode]["destructive-foreground"]))!.l
      ) < 0.001
    )
    assert.ok(
      Math.abs(fg.h! - oklch(parseColor(styles[mode].destructive))!.h!) < 0.5
    )
    assert.equal(overrides[mode].code, styles[mode].card)
    assert.equal(
      overrides[mode]["code-foreground"],
      styles[mode]["card-foreground"]
    )
  }
  const coss = importOverrides({
    light: { info: "#00f", "destructive-foreground": "#b00" },
  })
  assert.equal(coss.light["destructive-foreground"], "#b00")
})

test("color formats round trip with alpha, including computed color-mix results", () => {
  for (const input of [
    "0 0% 100%",
    "#ff00aa80",
    "oklch(.65 .1 240 / 30%)",
    "lab(50% 10 -20 / .6)",
    "color(srgb 0.2 0.4 0.6 / 0.5)",
    "oklab(0 0 0 / 0.04)",
  ])
    for (const format of [
      "triplet",
      "hex",
      "oklch",
      "hsl",
      "rgb",
      "lab",
    ] as const)
      equivalent(
        input,
        formatColor(input, format),
        format === "hex" || format === "rgb" ? 0.004 : 0.002
      )
  assert.equal(sourceFormat("oklch(1 0 0)"), "oklch")
})

test("exports match the coss globals.css shape and import back", () => {
  const theme = clone(defaults)
  theme.dark.info = "#ff00aa80"
  for (const mode of ["light", "dark"] as const) {
    theme[mode].radius = "1rem"
    theme[mode]["font-sans"] = '"Lora", serif'
    theme[mode]["letter-spacing"] = "0.025em"
    theme[mode]["shadow-blur"] = "8px"
  }
  const css = exportCss(theme, "4")
  assert.match(
    css,
    /@theme inline \{[\s\S]*--color-info-foreground: var\(--info-foreground\);/
  )
  assert.match(css, /--font-heading: var\(--font-sans\);/)
  assert.match(css, /--radius-xl: calc\(var\(--radius\) \+ 4px\);/)
  assert.ok(
    !/\.dark \{[^}]*--radius/.test(css),
    "shared tokens live on :root only"
  )
  assert.match(css, /--shadow-md: var\(--shadow-md\);/)
  assert.match(css, /--tracking-normal: 0\.025em;/)
  for (const input of [
    css,
    exportCss(theme, "3"),
    JSON.stringify(registryTheme(theme)),
    themeCss(theme, "hsl"),
  ]) {
    const imported = importTheme(input)
    for (const mode of ["light", "dark"] as const)
      for (const key of tokens) {
        const value = imported[mode][key]!
        if (colorTokens.includes(key as never))
          equivalent(value, theme[mode][key])
        else assert.equal(value, theme[mode][key])
      }
  }
})

test("coss source CSS imports concrete values and skips var(), color-mix() and --alpha()", () => {
  const overrides = importTheme(
    ":root { --radius: 0.5rem; --background: var(--color-white); --border: --alpha(var(--color-black) / 8%); --primary: #ff00aa; }\n.dark { --background: color-mix(in srgb, var(--color-neutral-950) 96%, var(--color-white)); --info: oklch(0.6 0.2 250); }"
  )
  assert.deepEqual(overrides, {
    light: { radius: "0.5rem", primary: "#ff00aa" },
    dark: { radius: "0.5rem", info: "oklch(0.6 0.2 250)" },
  })
  assert.equal(
    importTheme("@theme inline { --color-success: #00ff00; }").light.success,
    "#00ff00"
  )
})

test("imports reject malformed input without accepting arbitrary CSS", () => {
  for (const input of [
    "{}",
    "null",
    ":root { --primary: invalid; }",
    ":root { --primary: red;",
    ":root { --primary: red; } }",
    ":root { --font-sans: url(https://evil.test); }",
  ])
    assert.throws(() => importTheme(input), input)
  assert.equal(validValue("primary", "red; color: black"), false)
  assert.equal(validValue("radius", "-1rem"), false)
  assert.equal(validValue("radius", "1"), false)
  assert.equal(validValue("radius", "0"), true)
  assert.equal(validValue("font-sans", '"Cal Sans", sans-serif'), true)
})

test("only overridden tokens are injected, in the page format", () => {
  const styles = clone(defaults.light)
  styles.primary = "#ff0000"
  styles.radius = "0"
  const map = variables(
    styles,
    { primary: "#ff0000", radius: "0" },
    { primary: "hex" }
  )
  assert.deepEqual(map, {
    primary: "#ff0000",
    radius: "0rem",
    "radius-2xl": "calc(var(--radius) + 6px)",
  })
  assert.match(variables(styles, { info: styles.info }).info, /^oklch\(/)
})

test("HSL adjustments only touch colors and keep alpha", () => {
  const base = clone(defaults)
  const changed = adjustTheme(base, 60, 1, 1)
  assert.equal(changed.light.radius, base.light.radius)
  assert.ok(
    Math.abs(parseColor(changed.light.border)!.alpha! - 0.08) < 1 / 255,
    "hex8 keeps alpha to 1/255"
  )
  equivalent(
    adjustTheme(base, 0, 1, 1).light["chart-1"],
    base.light["chart-1"],
    0.004
  )
})

test("contrast composites translucent colors", () => {
  assert.equal(contrast("#fff", "#000"), 21)
  assert.ok(
    contrast(
      defaults.light["secondary-foreground"],
      defaults.light.secondary,
      defaults.light.background
    ) > 4.5
  )
})

test("layout export wires next/font variables for sans and mono", () => {
  const theme = clone(defaults)
  theme.light["font-sans"] = '"Inter", sans-serif'
  theme.light["font-mono"] = '"Geist Mono", monospace'
  const code = exportLayout(theme, [
    { family: "Inter", weights: ["400", "700"] },
    { family: "Geist Mono", weights: ["400"] },
  ])
  assert.match(code, /import \{ Inter, Geist_Mono \} from "next\/font\/google"/)
  assert.match(code, /variable: "--font-mono"/)
  assert.ok(!exportLayout(defaults, []).includes("next/font/google"))
})

test("encodeThemeHash and decodeThemeHash roundtrip theme overrides", async () => {
  const overrides = {
    light: { primary: "#ff0055", radius: "12px" },
    dark: { primary: "#ff3377" },
  }
  const hash = await encodeThemeHash(overrides, "modern-minimal")
  assert.ok(hash.length > 0)
  assert.ok(!hash.includes("+") && !hash.includes("/"))
  assert.ok(hash.startsWith("z_"))

  const decoded = await decodeThemeHash(hash)
  assert.ok(decoded)
  assert.equal(decoded.themeId, "modern-minimal")
  assert.equal(decoded.overrides.light.primary, "#ff0055")
  assert.equal(decoded.overrides.light.radius, "12px")
  assert.equal(decoded.overrides.dark.primary, "#ff3377")

  // Also test with leading '#theme='
  const decodedWithPrefix = await decodeThemeHash(`#theme=${hash}`)
  assert.ok(decodedWithPrefix)
  assert.equal(decodedWithPrefix.overrides.light.primary, "#ff0055")

  // Invalid hash returns null
  assert.equal(await decodeThemeHash("invalid-base64-!@#$"), null)
})
