import { describe, it, expect } from "vitest";
import { generateThemeCss } from "../generate-theme-css";
import { defaultThemeStyles } from "../theme-model";
import { normalizeThemeStyles } from "../normalize-theme-styles";

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
    expect(css).toMatch(/--primary: oklch\([^)]*\/ 0\.5\)/);
  });

  it("colorFormat:hex changes color output format", () => {
    const css = generateThemeCss(defaultThemeStyles, { colorFormat: "hex" });
    expect(css).toMatch(/--primary: #[0-9a-fA-F]{6}/);
    expect(css).not.toMatch(/--primary: oklch\(/);
  });
});
