import { converter } from "culori"
import { describe, expect, it } from "vitest"
import { adjustColorByHsl, HSL_PRESETS } from "../hsl-adjust"

const hsl = converter("hsl")
const toHsl = (color: string) => hsl(color)!

describe("adjustColorByHsl", () => {
  it("identity (0, 1, 1) leaves the color equivalent", () => {
    const input = "#3366cc"
    const out = adjustColorByHsl(input, 0, 1, 1)
    const a = toHsl(input)
    const b = toHsl(out)
    expect(b.h).toBeCloseTo(a.h ?? 0, 1)
    expect(b.s).toBeCloseTo(a.s ?? 0, 3)
    expect(b.l).toBeCloseTo(a.l ?? 0, 3)
  })

  it("hueShift 180 rotates hue by ~180°", () => {
    const input = "#3366cc"
    const before = toHsl(input).h ?? 0
    const after = toHsl(adjustColorByHsl(input, 180, 1, 1)).h ?? 0
    const delta = (((after - before) % 360) + 360) % 360
    expect(delta).toBeCloseTo(180, 0)
  })

  it("saturationScale 0 produces grayscale (s ≈ 0)", () => {
    const out = adjustColorByHsl("#3366cc", 0, 0, 1)
    expect(toHsl(out).s ?? 0).toBeCloseTo(0, 3)
  })

  it("lightnessScale clamps at the 0.1 floor", () => {
    // Dark chromatic blue (HSL l ≈ 0.125); scaling down would go below 0.1.
    const out = adjustColorByHsl("#101030", 0, 1, 0.1)
    expect(toHsl(out).l ?? 0).toBeCloseTo(0.1, 2)
  })

  it("lightnessScale clamps at the 1 ceiling", () => {
    const out = adjustColorByHsl("#101030", 0, 1, 10)
    expect(toHsl(out).l ?? 0).toBeCloseTo(1, 3)
  })

  it("returns unparseable input unchanged", () => {
    expect(adjustColorByHsl("not-a-color", 90, 2, 0.5)).toBe("not-a-color")
  })
})

describe("HSL_PRESETS", () => {
  it("has 15 presets, each with the 4 fields", () => {
    expect(HSL_PRESETS).toHaveLength(15)
    for (const p of HSL_PRESETS) {
      expect(typeof p.name).toBe("string")
      expect(p.name.length).toBeGreaterThan(0)
      expect(typeof p.hueShift).toBe("number")
      expect(typeof p.saturationScale).toBe("number")
      expect(typeof p.lightnessScale).toBe("number")
    }
  })
})
