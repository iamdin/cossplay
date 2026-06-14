import { describe, it, expect } from "vitest";
import { exportCss } from "../export-css";

describe("exportCss", () => {
  it("formats color values to oklch", () => {
    const css = exportCss({ base: {}, light: { primary: "#ffffff" }, dark: {} }, "oklch");
    expect(css).toContain("--primary: oklch(");
  });

  it("emits base tokens unformatted in :root", () => {
    const css = exportCss({ base: { radius: "0.5rem" }, light: {}, dark: {} }, "oklch");
    expect(css).toContain("--radius: 0.5rem;");
  });
});
