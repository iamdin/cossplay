import { describe, it, expect } from "vitest";
import { buildOverrideCss } from "../override-css";

describe("buildOverrideCss", () => {
  it("emits :root and .dark blocks from changed color tokens", () => {
    const css = buildOverrideCss({
      base: {},
      light: { primary: "oklch(0.5 0 0)" },
      dark: { primary: "oklch(0.8 0 0)" },
    });
    expect(css).toBe(
      ":root {\n  --primary: oklch(0.5 0 0);\n}\n\n.dark {\n  --primary: oklch(0.8 0 0);\n}"
    );
  });

  it("puts base tokens in :root, never in .dark", () => {
    const css = buildOverrideCss({
      base: { radius: "1rem", spacing: "0.3rem" },
      light: {},
      dark: { primary: "red" },
    });
    expect(css).toBe(
      ":root {\n  --radius: 1rem;\n  --spacing: 0.3rem;\n}\n\n.dark {\n  --primary: red;\n}"
    );
  });

  it("orders :root as base first, then light", () => {
    const css = buildOverrideCss({
      base: { radius: "1rem" },
      light: { primary: "red" },
      dark: {},
    });
    expect(css).toBe(":root {\n  --radius: 1rem;\n  --primary: red;\n}");
  });

  it("does NOT run formatColor on base values, only on colors", () => {
    const css = buildOverrideCss(
      { base: { radius: "0.625rem" }, light: { primary: "x" }, dark: {} },
      (v) => `FMT(${v})`
    );
    expect(css).toBe(":root {\n  --radius: 0.625rem;\n  --primary: FMT(x);\n}");
  });

  it("omits .dark block when no dark changes", () => {
    expect(buildOverrideCss({ base: {}, light: { primary: "red" }, dark: {} })).toBe(
      ":root {\n  --primary: red;\n}"
    );
  });

  it("returns empty string for no changes", () => {
    expect(buildOverrideCss({ base: {}, light: {}, dark: {} })).toBe("");
  });

  it("skips blank values", () => {
    expect(buildOverrideCss({ base: { radius: "  " }, light: { primary: "  " }, dark: {} })).toBe("");
  });

  it("tolerates a legacy object missing base", () => {
    const css = buildOverrideCss({ light: { primary: "red" }, dark: {} } as never);
    expect(css).toBe(":root {\n  --primary: red;\n}");
  });
});
