import { describe, it, expect } from "vitest";
import { defaultPresets, presetToOverride } from "../presets";
import { COLOR_TOKENS } from "../tokens";

describe("presets", () => {
  it("loads built-in presets", () => {
    expect(Object.keys(defaultPresets).length).toBeGreaterThan(10);
    expect(defaultPresets["modern-minimal"]).toBeTruthy();
  });

  it("presetToOverride returns base/light/dark with only color tokens", () => {
    const ov = presetToOverride(defaultPresets["modern-minimal"]);
    expect(ov.base).toEqual({});
    for (const k of Object.keys(ov.light)) {
      expect(COLOR_TOKENS.has(k)).toBe(true);
    }
    expect(ov.light.primary).toBeTruthy();
  });
});
