import { describe, it, expect } from "vitest";
import { parseCssInput } from "../parse-css-input";

describe("parseCssInput", () => {
  const css = `:root {
    --background: oklch(1 0 0);
    --radius: 0.5rem;
    --not-a-real-token: 123;
  }
  .dark {
    --background: oklch(0 0 0);
  }`;

  const { lightColors, darkColors } = parseCssInput(css);

  it("normalizes color vars to hex", () => {
    expect(lightColors.background).toMatch(/^#[0-9a-f]{6}$/i);
    expect(lightColors.background?.toLowerCase()).toBe("#ffffff");
    expect(darkColors.background?.toLowerCase()).toBe("#000000");
  });

  it("keeps COMMON_STYLES (non-color) verbatim", () => {
    expect(lightColors.radius).toBe("0.5rem");
  });

  it("drops unknown variables", () => {
    expect((lightColors as Record<string, unknown>)["not-a-real-token"]).toBeUndefined();
  });

  it("wraps bare HSL triples before conversion", () => {
    const { lightColors: lc } = parseCssInput(":root { --background: 0 0% 100%; }");
    expect(lc.background?.toLowerCase()).toBe("#ffffff");
  });

  it("returns empty maps for input with no :root/.dark blocks", () => {
    const { lightColors: lc, darkColors: dc } = parseCssInput("body { color: red; }");
    expect(Object.keys(lc)).toHaveLength(0);
    expect(Object.keys(dc)).toHaveLength(0);
  });
});
