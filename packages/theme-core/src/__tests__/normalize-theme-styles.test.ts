import { describe, it, expect } from "vitest";
import { normalizeThemeStyles } from "../normalize-theme-styles";
import { defaultThemeStyles } from "../theme-model";

describe("normalizeThemeStyles", () => {
  it("passes through a full ThemeStyles", () => {
    const out = normalizeThemeStyles(defaultThemeStyles);
    expect(out.light.primary).toBe(defaultThemeStyles.light.primary);
    expect(out.dark.background).toBe(defaultThemeStyles.dark.background);
  });

  it("overlays legacy {base,light,dark} delta correctly", () => {
    const out = normalizeThemeStyles({
      base: { radius: "1rem" },
      light: { primary: "red" },
      dark: {},
    });
    // base radius applied to BOTH modes
    expect(out.light.radius).toBe("1rem");
    expect(out.dark.radius).toBe("1rem");
    // light color override applied to light only
    expect(out.light.primary).toBe("red");
    expect(out.dark.primary).toBe(defaultThemeStyles.dark.primary);
    // untouched fields fall back to defaults
    expect(out.light.background).toBe(defaultThemeStyles.light.background);
  });

  it("returns defaults for null/garbage", () => {
    expect(normalizeThemeStyles(null).light.primary).toBe(defaultThemeStyles.light.primary);
    expect(normalizeThemeStyles(42).dark.background).toBe(defaultThemeStyles.dark.background);
    expect(normalizeThemeStyles("nope").light.radius).toBe(defaultThemeStyles.light.radius);
  });

  it("does not alias the defaults object", () => {
    const out = normalizeThemeStyles({ light: { primary: "blue" }, dark: {} });
    expect(out.light).not.toBe(defaultThemeStyles.light);
    expect(out.dark).not.toBe(defaultThemeStyles.dark);
    // mutating output must not touch defaults
    out.light.primary = "green";
    expect(defaultThemeStyles.light.primary).not.toBe("green");
  });
});
