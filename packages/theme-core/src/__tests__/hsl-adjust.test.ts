import { describe, it, expect } from "vitest";
import { converter } from "culori";
import {
  adjustColorByHsl,
  applyHslAdjustmentsToStyles,
  defaultHslAdjustments,
  HSL_PRESETS,
} from "../hsl-adjust";
import { COMMON_STYLES, defaultThemeStyles } from "../theme-model";

const toHsl = converter("hsl");

describe("adjustColorByHsl", () => {
  it("identity (0, 1, 1) leaves the color equivalent", () => {
    const input = "#3366cc";
    const out = adjustColorByHsl(input, 0, 1, 1);
    const a = toHsl(input);
    const b = toHsl(out);
    expect(b.h).toBeCloseTo(a.h ?? 0, 1);
    expect(b.s).toBeCloseTo(a.s ?? 0, 3);
    expect(b.l).toBeCloseTo(a.l ?? 0, 3);
  });

  it("hueShift 180 rotates hue by ~180°", () => {
    const input = "#3366cc";
    const before = toHsl(input).h ?? 0;
    const after = toHsl(adjustColorByHsl(input, 180, 1, 1)).h ?? 0;
    const delta = ((after - before) % 360 + 360) % 360;
    expect(delta).toBeCloseTo(180, 0);
  });

  it("saturationScale 0 produces grayscale (s ≈ 0)", () => {
    const out = adjustColorByHsl("#3366cc", 0, 0, 1);
    expect(toHsl(out).s ?? 0).toBeCloseTo(0, 3);
  });

  it("lightnessScale clamps at the 0.1 floor", () => {
    // Dark chromatic blue (HSL l ≈ 0.125); scaling down would go below 0.1.
    const out = adjustColorByHsl("#101030", 0, 1, 0.1);
    expect(toHsl(out).l ?? 0).toBeCloseTo(0.1, 2);
  });

  it("lightnessScale clamps at the 1 ceiling", () => {
    const out = adjustColorByHsl("#101030", 0, 1, 10);
    expect(toHsl(out).l ?? 0).toBeCloseTo(1, 3);
  });

  it("returns unparseable input unchanged", () => {
    expect(adjustColorByHsl("not-a-color", 90, 2, 0.5)).toBe("not-a-color");
  });
});

describe("applyHslAdjustmentsToStyles", () => {
  const adj = { hueShift: 60, saturationScale: 0.8, lightnessScale: 1.1 };

  it("leaves COMMON_STYLES keys unchanged", () => {
    const result = applyHslAdjustmentsToStyles(defaultThemeStyles, adj);
    for (const key of COMMON_STYLES) {
      expect(result.light[key]).toBe(defaultThemeStyles.light[key]);
      expect(result.dark[key]).toBe(defaultThemeStyles.dark[key]);
    }
  });

  it("changes chromatic color keys for a non-identity adjustment", () => {
    const result = applyHslAdjustmentsToStyles(defaultThemeStyles, adj);
    // destructive / chart-* are chromatic, so HSL adjustments change them.
    expect(result.light.destructive).not.toBe(defaultThemeStyles.light.destructive);
    expect(result.light["chart-1"]).not.toBe(defaultThemeStyles.light["chart-1"]);
    expect(result.dark.destructive).not.toBe(defaultThemeStyles.dark.destructive);
  });

  it("returns new object references (so a subscription would fire)", () => {
    const result = applyHslAdjustmentsToStyles(defaultThemeStyles, adj);
    expect(result).not.toBe(defaultThemeStyles);
    expect(result.light).not.toBe(defaultThemeStyles.light);
    expect(result.dark).not.toBe(defaultThemeStyles.dark);
  });

  it("identity adjustment yields a faithful copy (same as per-key identity adjust)", () => {
    // An identity adjustment must equal applying adjustColorByHsl(.,0,1,1) to
    // each color token — i.e. the same gamut-clipping roundtrip, no extra shift.
    const result = applyHslAdjustmentsToStyles(defaultThemeStyles, defaultHslAdjustments);
    for (const key of ["destructive", "chart-1", "primary", "background"] as const) {
      const expected = adjustColorByHsl(defaultThemeStyles.light[key], 0, 1, 1);
      expect(result.light[key]).toBe(expected);
    }
  });
});

describe("HSL_PRESETS", () => {
  it("has 15 presets, each with the 4 fields", () => {
    expect(HSL_PRESETS).toHaveLength(15);
    for (const p of HSL_PRESETS) {
      expect(typeof p.name).toBe("string");
      expect(p.name.length).toBeGreaterThan(0);
      expect(typeof p.hueShift).toBe("number");
      expect(typeof p.saturationScale).toBe("number");
      expect(typeof p.lightnessScale).toBe("number");
    }
  });
});
