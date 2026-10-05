import { describe, expect, it } from "vitest"
import { defaultPresets } from "../presets"

describe("presets", () => {
  it("loads built-in presets", () => {
    expect(Object.keys(defaultPresets).length).toBeGreaterThan(10)
    expect(defaultPresets["modern-minimal"]).toBeTruthy()
  })
})
