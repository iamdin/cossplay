import { describe, it, expect } from "vitest";
import { defaultPresets, presetToThemeStyles } from "../presets";
import { defaultThemeStyles } from "../theme-model";

describe("presets", () => {
  it("loads built-in presets", () => {
    expect(Object.keys(defaultPresets).length).toBeGreaterThan(10);
    expect(defaultPresets["modern-minimal"]).toBeTruthy();
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
