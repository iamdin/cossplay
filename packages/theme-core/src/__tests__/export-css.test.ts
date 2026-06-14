import { describe, it, expect } from "vitest";
import { exportCss } from "../export-css";

describe("exportCss", () => {
  it("formats values to oklch", () => {
    const css = exportCss({ light: { primary: "#ffffff" }, dark: {} }, "oklch");
    expect(css).toContain("--primary: oklch(");
  });
});
