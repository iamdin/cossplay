import { describe, it, expect } from "vitest";
import { emptyOverride, normalizeOverride } from "../types";

describe("emptyOverride", () => {
  it("has base, light, dark", () => {
    expect(emptyOverride()).toEqual({ base: {}, light: {}, dark: {} });
  });
});

describe("normalizeOverride", () => {
  it("adds missing base to a legacy {light,dark} object", () => {
    const out = normalizeOverride({ light: { primary: "red" }, dark: {} });
    expect(out).toEqual({ base: {}, light: { primary: "red" }, dark: {} });
  });

  it("is idempotent on a valid override", () => {
    const valid = { base: { radius: "1rem" }, light: {}, dark: {} };
    expect(normalizeOverride(valid)).toEqual(valid);
  });

  it("returns an empty override for null/garbage", () => {
    expect(normalizeOverride(null)).toEqual({ base: {}, light: {}, dark: {} });
    expect(normalizeOverride(42)).toEqual({ base: {}, light: {}, dark: {} });
  });

  it("copies (does not alias) the input buckets", () => {
    const input = { base: {}, light: { primary: "red" }, dark: {} };
    const out = normalizeOverride(input);
    out.light.primary = "blue";
    expect(input.light.primary).toBe("red");
  });
});
