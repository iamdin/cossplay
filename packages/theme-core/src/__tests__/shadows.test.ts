import { describe, it, expect } from "vitest";
import { getShadowMap } from "../shadows";
import { defaultLightThemeStyles } from "../theme-model";

describe("getShadowMap", () => {
  it("returns the 8 expected shadow keys as non-empty strings", () => {
    const map = getShadowMap(defaultLightThemeStyles);
    const expected = [
      "shadow-2xs",
      "shadow-xs",
      "shadow-sm",
      "shadow",
      "shadow-md",
      "shadow-lg",
      "shadow-xl",
      "shadow-2xl",
    ];
    expect(Object.keys(map).sort()).toEqual([...expected].sort());
    for (const key of expected) {
      expect(typeof map[key]).toBe("string");
      expect(map[key].length).toBeGreaterThan(0);
      expect(map[key]).toContain("hsl(");
    }
  });

  it("two-layer shadows contain a comma-separated second layer", () => {
    const map = getShadowMap(defaultLightThemeStyles);
    expect(map["shadow-md"]).toContain(",");
    expect(map["shadow-2xs"]).not.toContain(",");
  });
});
