import { describe, expect, it } from "vitest"
import { colorFormatter, toHex, toHex8 } from "../color-converter"

describe("colorFormatter", () => {
  it("converts hex to oklch string", () => {
    expect(colorFormatter("#ffffff", "oklch").startsWith("oklch(")).toBe(true)
  })

  it("round-trips opaque hex -> oklch -> hex within tolerance", () => {
    const oklch = colorFormatter("#3b82f6", "oklch")
    expect(toHex(oklch).toLowerCase()).toBe("#3b82f6")
  })

  it("returns input unchanged on invalid color", () => {
    expect(colorFormatter("not-a-color", "oklch")).toBe("not-a-color")
  })

  it("preserves alpha in oklch (emits / a)", () => {
    const out = colorFormatter("#00000080", "oklch") // ~0.5 alpha
    expect(out).toMatch(/oklch\([^)]+ \/ 0?\.5\d*\)/)
  })

  it("does NOT emit / a for opaque colors", () => {
    expect(colorFormatter("#000000", "oklch")).not.toContain("/")
  })

  it("preserves alpha in rgb (rgba)", () => {
    expect(colorFormatter("#00000080", "rgb")).toMatch(/rgba?\(/)
    expect(colorFormatter("#00000080", "rgb")).toContain("0.5")
  })

  it("emits 8-digit hex when alpha < 1, 6-digit when opaque", () => {
    expect(colorFormatter("#11223380", "hex").length).toBe(9) // #11223380
    expect(colorFormatter("#112233", "hex")).toBe("#112233")
  })
})

describe("toHex", () => {
  it("parses oklch to hex", () => {
    expect(toHex("oklch(1 0 0)").toLowerCase()).toBe("#ffffff")
  })
})

describe("toHex8", () => {
  it("always returns 8-digit hex (ff for opaque)", () => {
    expect(toHex8("#3b82f6").toLowerCase()).toBe("#3b82f6ff")
  })
  it("encodes alpha", () => {
    expect(toHex8("oklch(0 0 0 / 0.5)").toLowerCase().endsWith("80")).toBe(true)
  })
  it("returns input unchanged on invalid color", () => {
    expect(toHex8("nope")).toBe("nope")
  })
})
