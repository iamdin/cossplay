import { describe, it, expect } from "vitest";
import { buildOverrideCss, exportCss } from "../override-css";

describe("buildOverrideCss", () => {
  it("emits :root and .dark blocks from changed tokens", () => {
    const css = buildOverrideCss({
      light: { primary: "oklch(0.5 0 0)" },
      dark: { primary: "oklch(0.8 0 0)" },
    });
    expect(css).toBe(
      ":root {\n  --primary: oklch(0.5 0 0);\n}\n\n.dark {\n  --primary: oklch(0.8 0 0);\n}"
    );
  });

  it("omits .dark block when no dark changes", () => {
    const css = buildOverrideCss({ light: { primary: "red" }, dark: {} });
    expect(css).toBe(":root {\n  --primary: red;\n}");
  });

  it("returns empty string for no changes", () => {
    expect(buildOverrideCss({ light: {}, dark: {} })).toBe("");
  });

  it("skips blank values", () => {
    expect(buildOverrideCss({ light: { primary: "  " }, dark: {} })).toBe("");
  });
});

describe("exportCss", () => {
  it("formats values to oklch", () => {
    const css = exportCss({ light: { primary: "#ffffff" }, dark: {} }, "oklch");
    expect(css).toContain("--primary: oklch(");
  });
});
