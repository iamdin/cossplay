import { describe, it, expect } from "vitest";
import { defaultPresets, presetToOverride, presetToThemeStyles } from "../presets";
import { COLOR_TOKENS } from "../tokens";
import { defaultThemeStyles } from "../theme-model";

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

  it("presetToThemeStyles returns a full ThemeStyles with defaults fallback", () => {
    const styles = presetToThemeStyles(defaultPresets["modern-minimal"]);
    // preset override present
    expect(styles.light.primary).toBeTruthy();
    // a non-overridden non-color field falls back to defaults
    expect(styles.light["font-mono"] === defaultPresets["modern-minimal"].styles.light["font-mono"]
      || styles.light["font-mono"] === defaultThemeStyles.light["font-mono"]).toBe(true);
    // shadow primitives the preset doesn't set come from defaults
    expect(styles.light["shadow-opacity"]).toBe(defaultThemeStyles.light["shadow-opacity"]);
    expect(styles.dark["shadow-color"]).toBe(defaultThemeStyles.dark["shadow-color"]);
  });
});
