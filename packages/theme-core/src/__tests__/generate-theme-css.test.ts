import { describe, it, expect } from "vitest";
import { generateThemeCss } from "../generate-theme-css";
import { defaultThemeStyles } from "../theme-model";
import { normalizeThemeStyles } from "../normalize-theme-styles";
import { FONTS } from "../fonts";

describe("generateThemeCss", () => {
  it("emits :root and .dark blocks", () => {
    const css = generateThemeCss(defaultThemeStyles);
    expect(css).toContain(":root {");
    expect(css).toContain(".dark {");
    expect(css).toContain("\n\n"); // blocks separated by blank line
  });

  it("contains a color var formatted as oklch by default", () => {
    const css = generateThemeCss(defaultThemeStyles);
    expect(css).toMatch(/--primary: oklch\(/);
  });

  it("contains radius, spacing, font-sans, and a shadow var", () => {
    const css = generateThemeCss(defaultThemeStyles);
    expect(css).toContain("--radius:");
    expect(css).toContain("--spacing:");
    expect(css).toContain("--font-sans:");
    expect(css).toMatch(/--shadow(-2xs|-sm|-md)?:/);
  });

  it("preserves alpha for a translucent color", () => {
    const styles = normalizeThemeStyles({
      light: { primary: "oklch(0.6 0.2 250 / 0.5)" },
      dark: {},
    });
    const css = generateThemeCss(styles);
    // formatNumber 字节对齐后非整数保留 4 位小数：0.5 → 0.5000
    expect(css).toMatch(/--primary: oklch\([^)]*\/ 0\.5000\)/);
  });

  it("colorFormat:hex changes color output format", () => {
    const css = generateThemeCss(defaultThemeStyles, { colorFormat: "hex" });
    expect(css).toMatch(/--primary: #[0-9a-fA-F]{6}/);
    expect(css).not.toMatch(/--primary: oklch\(/);
  });

  it("prepends a Google @import when a Google font is selected, with :root following", () => {
    const inter = FONTS.find((f) => f.id === "inter")!;
    const styles = normalizeThemeStyles(
      { light: { "font-sans": inter.stack }, dark: { "font-sans": inter.stack } },
      defaultThemeStyles
    );
    const css = generateThemeCss(styles);
    // (a) output starts with @import url(
    expect(css.startsWith("@import url(")).toBe(true);
    expect(css).toContain("fonts.googleapis.com/css2?");
    expect(css).toContain("family=Inter:wght@");
    // (b) the :root block still follows
    expect(css).toContain(":root {");
    expect(css.indexOf("@import")).toBeLessThan(css.indexOf(":root {"));
  });

  it("emits no @import when all fonts are system/non-Google (defaults)", () => {
    const css = generateThemeCss(defaultThemeStyles);
    expect(css).not.toContain("@import");
    expect(css.startsWith(":root {")).toBe(true);
  });
});
