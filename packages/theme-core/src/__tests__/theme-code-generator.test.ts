import { describe, it, expect } from "vitest";
import {
  generateThemeCode,
  generateTailwindConfigCode,
  generateTailwindV3Config,
  generateLayoutCode,
} from "../theme-code-generator";
import { colorFormatter } from "../color-converter";
import { defaultThemeStyles, defaultLightThemeStyles } from "../theme-model";

describe("colorFormatter tailwindVersion (bare vs wrapped hsl)", () => {
  it("v4 hsl wraps in hsl(...)", () => {
    expect(colorFormatter("#ffffff", "hsl", "4")).toBe("hsl(0 0% 100%)");
  });

  it("v3 hsl emits a bare triple", () => {
    expect(colorFormatter("#ffffff", "hsl", "3")).toBe("0 0% 100%");
  });

  it("oklch/rgb/hex unaffected by tailwindVersion", () => {
    expect(colorFormatter("#ffffff", "oklch", "3").startsWith("oklch(")).toBe(true);
    expect(colorFormatter("#ffffff", "rgb", "3").startsWith("rgb")).toBe(true);
    expect(colorFormatter("#ffffff", "hex", "3")).toBe("#ffffff");
  });

  it("parse-fail returns input unchanged", () => {
    expect(colorFormatter("not-a-color", "hsl", "3")).toBe("not-a-color");
  });
});

describe("generateThemeCode v4 (oklch)", () => {
  const out = generateThemeCode(defaultThemeStyles, "oklch", "4");

  it("starts with the tailwind v4 import", () => {
    expect(out.startsWith('@import "tailwindcss";')).toBe(true);
  });

  it("contains the dark custom-variant, :root, .dark, @theme inline and @layer base", () => {
    expect(out).toContain("@custom-variant dark (&:is(.dark *));");
    expect(out).toContain(":root {");
    expect(out).toContain(".dark {");
    expect(out).toContain("@theme inline {");
    expect(out).toContain("@apply border-border outline-ring/50;");
  });

  it("default (letter-spacing 0em) emits NO --tracking-* block", () => {
    expect(out).not.toContain("--tracking-tighter");
    expect(out).not.toContain("--tracking-wide");
  });

  it("default body has no letter-spacing line", () => {
    expect(out).not.toContain("letter-spacing: var(--tracking-normal);");
  });

  it("contains computed shadow vars", () => {
    expect(out).toContain("--shadow-sm:");
    expect(out).toContain("--shadow-2xl:");
    // non-empty box-shadow string (hsl-wrapped shadow color)
    expect(out).toMatch(/--shadow-2xl:\s+[^;]*hsl\([^;]+;/);
  });
});

describe("generateThemeCode v4 with non-zero tracking", () => {
  const tracked = {
    light: { ...defaultLightThemeStyles, "letter-spacing": "0.025em" },
    dark: { ...defaultThemeStyles.dark, "letter-spacing": "0.025em" },
  };
  const out = generateThemeCode(tracked, "oklch", "4");

  it("emits the --tracking-* block inside @theme inline", () => {
    expect(out).toContain("--tracking-tighter: calc(var(--tracking-normal) - 0.05em);");
    expect(out).toContain("--tracking-widest: calc(var(--tracking-normal) + 0.1em);");
  });

  it("emits body letter-spacing line", () => {
    expect(out).toContain("letter-spacing: var(--tracking-normal);");
  });
});

describe("generateThemeCode v3 (hsl)", () => {
  const out = generateThemeCode(defaultThemeStyles, "hsl", "3");

  it("starts with @tailwind base;", () => {
    expect(out.startsWith("@tailwind base;")).toBe(true);
    expect(out).toContain("@tailwind components;");
    expect(out).toContain("@tailwind utilities;");
  });

  it("color values are BARE triples, not hsl(...)-wrapped", () => {
    expect(out).toMatch(/--background:\s*[\d.]+ [\d.]+% [\d.]+%;/);
  });

  it("does not wrap color tokens in hsl(...)", () => {
    // shadow strings legitimately use hsl(...); the color tokens must not.
    expect(out).toMatch(/--background:\s*(?!hsl\()/);
  });
});

describe("generateTailwindV3Config", () => {
  const out = generateTailwindV3Config(defaultThemeStyles, "hsl");

  it("emits module.exports config with darkMode class", () => {
    expect(out).toContain("module.exports");
    expect(out).toContain('darkMode: ["class"]');
  });

  it("color tokens use hsl(var(--x)) for hsl format", () => {
    expect(out).toContain('"hsl(var(--background))"');
    expect(out).toContain('"hsl(var(--primary))"');
  });

  it("non-hsl format uses var(--x) directly", () => {
    const oklchOut = generateTailwindV3Config(defaultThemeStyles, "oklch");
    expect(oklchOut).toContain('"var(--background)"');
  });

  it("emits borderRadius calc + fontFamily", () => {
    expect(out).toContain("borderRadius: {");
    expect(out).toContain('xl: "calc(var(--radius) + 4px)"');
    expect(out).toContain('lg: "var(--radius)"');
    expect(out).toContain('md: "calc(var(--radius) - 2px)"');
    expect(out).toContain('sm: "calc(var(--radius) - 4px)"');
    expect(out).toContain("fontFamily: {");
    expect(out).toContain('sans: ["var(--font-sans)"]');
  });

  it("generateTailwindConfigCode delegates to V3 config", () => {
    expect(generateTailwindConfigCode(defaultThemeStyles, "hsl")).toBe(out);
  });
});

describe("generateLayoutCode", () => {
  it("default (system fonts only) emits no next/font/google import", () => {
    const out = generateLayoutCode(defaultThemeStyles);
    expect(out).not.toContain("next/font/google");
    expect(out).toContain('className="antialiased"');
  });

  it("named font emits a google font import + variable", () => {
    const withFont = {
      light: { ...defaultLightThemeStyles, "font-sans": "Inter, ui-sans-serif, sans-serif" },
      dark: defaultThemeStyles.dark,
    };
    const out = generateLayoutCode(withFont);
    expect(out).toContain('from "next/font/google"');
    expect(out).toContain("import { Inter }");
    expect(out).toContain('variable: "--font-sans"');
  });
});
