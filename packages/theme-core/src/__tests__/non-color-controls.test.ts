import { describe, it, expect } from "vitest";
import { NON_COLOR_CONTROLS, NON_COLOR_TOKENS } from "../non-color-controls";

describe("NON_COLOR_CONTROLS", () => {
  it("includes radius, spacing, font-sans, font-mono", () => {
    const tokens = NON_COLOR_CONTROLS.map((c) => c.token);
    expect(tokens).toEqual(["radius", "spacing", "font-sans", "font-mono"]);
  });

  it("sliders carry min/max/step/unit", () => {
    const radius = NON_COLOR_CONTROLS.find((c) => c.token === "radius")!;
    expect(radius.kind).toBe("slider");
    expect(radius.unit).toBe("rem");
    expect(typeof radius.min).toBe("number");
    expect(typeof radius.max).toBe("number");
    expect(typeof radius.step).toBe("number");
  });

  it("font controls have kind 'font'", () => {
    expect(NON_COLOR_CONTROLS.find((c) => c.token === "font-sans")!.kind).toBe("font");
  });

  it("NON_COLOR_TOKENS is the set of control tokens", () => {
    expect(NON_COLOR_TOKENS.has("radius")).toBe(true);
    expect(NON_COLOR_TOKENS.has("primary")).toBe(false);
  });
});
