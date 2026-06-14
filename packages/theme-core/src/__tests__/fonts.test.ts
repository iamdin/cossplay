import { describe, it, expect } from "vitest";
import { FONTS, findFontByStack, googleFontHref } from "../fonts";

describe("FONTS", () => {
  it("has both sans and mono entries", () => {
    expect(FONTS.some((f) => f.kind === "sans")).toBe(true);
    expect(FONTS.some((f) => f.kind === "mono")).toBe(true);
  });
  it("first sans and first mono are system stacks without google", () => {
    expect(FONTS.find((f) => f.kind === "sans")!.google).toBeUndefined();
    expect(FONTS.find((f) => f.kind === "mono")!.google).toBeUndefined();
  });
});

describe("findFontByStack", () => {
  it("finds a font by its exact stack", () => {
    const inter = FONTS.find((f) => f.id === "inter")!;
    expect(findFontByStack(inter.stack)?.id).toBe("inter");
  });
  it("returns undefined for unknown stack", () => {
    expect(findFontByStack("Comic Sans")).toBeUndefined();
  });
});

describe("googleFontHref", () => {
  it("returns null when no google fonts are selected", () => {
    const systemSans = FONTS.find((f) => f.id === "system-sans")!;
    expect(googleFontHref([systemSans.stack])).toBeNull();
    expect(googleFontHref([])).toBeNull();
  });
  it("builds a css2 url with + for spaces and ; between weights", () => {
    const jb = FONTS.find((f) => f.id === "jetbrains-mono")!;
    const href = googleFontHref([jb.stack]);
    expect(href).toContain("https://fonts.googleapis.com/css2?");
    expect(href).toContain("family=JetBrains+Mono:wght@");
    expect(href).toContain("display=swap");
  });
  it("combines multiple families", () => {
    const inter = FONTS.find((f) => f.id === "inter")!;
    const jb = FONTS.find((f) => f.id === "jetbrains-mono")!;
    const href = googleFontHref([inter.stack, jb.stack])!;
    expect(href).toContain("family=Inter:wght@");
    expect(href).toContain("family=JetBrains+Mono:wght@");
  });
});
