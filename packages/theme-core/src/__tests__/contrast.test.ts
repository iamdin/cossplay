import { describe, it, expect } from "vitest";
import {
  CONTRAST_CATEGORIES,
  getContrastRatio,
  MIN_CONTRAST_RATIO,
} from "../contrast";
import { defaultThemeStyles } from "../theme-model";

describe("getContrastRatio", () => {
  it("white on black is ≈ 21", () => {
    expect(getContrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0.5);
  });

  it("same color is ≈ 1", () => {
    expect(getContrastRatio("#777777", "#777777")).toBeCloseTo(1, 2);
  });

  it("a known mid pair is within tolerance", () => {
    // #767676 on #ffffff is a well-known ~4.54:1 boundary pair.
    expect(getContrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 1);
  });

  it("classifies pass/fail against MIN_CONTRAST_RATIO", () => {
    expect(getContrastRatio("#ffffff", "#000000")).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO);
    expect(getContrastRatio("#aaaaaa", "#ffffff")).toBeLessThan(MIN_CONTRAST_RATIO);
  });
});

describe("CONTRAST_CATEGORIES", () => {
  it("has 3 categories and 11 pairs total", () => {
    expect(CONTRAST_CATEGORIES).toHaveLength(3);
    const total = CONTRAST_CATEGORIES.reduce((n, c) => n + c.pairs.length, 0);
    expect(total).toBe(11);
  });

  it("every foregroundId/backgroundId is a valid key of the default light styles", () => {
    const keys = new Set(Object.keys(defaultThemeStyles.light));
    for (const category of CONTRAST_CATEGORIES) {
      for (const pair of category.pairs) {
        expect(keys.has(pair.foregroundId)).toBe(true);
        expect(keys.has(pair.backgroundId)).toBe(true);
      }
    }
  });
});
