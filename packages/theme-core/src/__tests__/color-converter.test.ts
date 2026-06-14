import { describe, it, expect } from "vitest";
import { colorFormatter, toHex } from "../color-converter";

describe("colorFormatter", () => {
  it("converts hex to oklch string", () => {
    const out = colorFormatter("#ffffff", "oklch");
    expect(out.startsWith("oklch(")).toBe(true);
  });

  it("round-trips hex -> oklch -> hex within tolerance", () => {
    const oklch = colorFormatter("#3b82f6", "oklch");
    const back = toHex(oklch);
    expect(back.toLowerCase()).toBe("#3b82f6");
  });

  it("returns input unchanged on invalid color", () => {
    expect(colorFormatter("not-a-color", "oklch")).toBe("not-a-color");
  });
});

describe("toHex", () => {
  it("parses oklch to hex", () => {
    expect(toHex("oklch(1 0 0)").toLowerCase()).toBe("#ffffff");
  });
});
