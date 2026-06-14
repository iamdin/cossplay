import { describe, it, expect } from "vitest";
import { generateThemeRegistryItemFromStyles } from "../registry-generator";
import { defaultThemeStyles } from "../theme-model";

describe("generateThemeRegistryItemFromStyles", () => {
  const item = generateThemeRegistryItemFromStyles("my-theme", defaultThemeStyles);

  it("has the registry-item shape", () => {
    expect(item.name).toBe("my-theme");
    expect(item.type).toBe("registry:style");
    expect(item.$schema).toBe("https://ui.shadcn.com/schema/registry-item.json");
  });

  it("forces colors to oklch", () => {
    expect(item.cssVars.light.background.startsWith("oklch(")).toBe(true);
    expect(item.cssVars.dark.background.startsWith("oklch(")).toBe(true);
  });

  it("theme block carries radius + fonts + tracking", () => {
    expect(item.cssVars.theme.radius).toBeTruthy();
    expect(item.cssVars.theme["font-sans"]).toBeTruthy();
    expect(item.cssVars.theme["font-mono"]).toBeTruthy();
    expect(item.cssVars.theme["font-serif"]).toBeTruthy();
    expect(item.cssVars.theme["tracking-tighter"]).toContain("calc(var(--tracking-normal)");
  });

  it("light/dark carry computed shadow strings + tracking-normal/spacing", () => {
    expect(item.cssVars.light["shadow-2xl"]).toContain("hsl(");
    expect(item.cssVars.dark["shadow-2xl"]).toContain("hsl(");
    expect(item.cssVars.light["tracking-normal"]).toBe("0em");
    expect(item.cssVars.light.spacing).toBe("0.25rem");
  });

  it("css @layer base body sets letter-spacing var", () => {
    expect(item.css["@layer base"].body["letter-spacing"]).toBe("var(--tracking-normal)");
  });

  it("does not mutate the input styles", () => {
    expect(defaultThemeStyles.light.background).toBe("oklch(1 0 0)");
  });
});
