/**
 * Static font data + pure helpers. The FontPicker uses the `FALLBACK_FONTS` list.
 */

export type FontCategory =
  | "sans-serif"
  | "serif"
  | "display"
  | "handwriting"
  | "monospace"

// App's font info type.
export type FontInfo = {
  family: string
  category: FontCategory
  variants: string[]
  variable: boolean
}

// Categories mapped to their display names and common fallbacks.
export const FONT_CATEGORIES = {
  "sans-serif": {
    label: "Sans Serif",
    fallback: "ui-sans-serif, system-ui, sans-serif",
  },
  serif: {
    label: "Serif",
    fallback: "ui-serif, Georgia, serif",
  },
  monospace: {
    label: "Monospace",
    fallback:
      "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
  display: {
    label: "Display",
    fallback: "ui-serif, Georgia, serif",
  },
  handwriting: {
    label: "Handwriting",
    fallback: "cursive",
  },
} as const

// Fallback fonts (must be in sync with the built-in fonts).
export const FALLBACK_FONTS: FontInfo[] = [
  // Sans Serif fonts
  {
    family: "Inter",
    category: "sans-serif",
    variants: ["400", "600", "700"],
    variable: true,
  },
  {
    family: "Roboto",
    category: "sans-serif",
    variants: ["400", "600", "700"],
    variable: false,
  },
  {
    family: "Open Sans",
    category: "sans-serif",
    variants: ["400", "600", "700"],
    variable: true,
  },
  {
    family: "Poppins",
    category: "sans-serif",
    variants: ["400", "600", "700"],
    variable: false,
  },
  {
    family: "Montserrat",
    category: "sans-serif",
    variants: ["400", "600", "700"],
    variable: false,
  },
  {
    family: "Outfit",
    category: "sans-serif",
    variants: ["400", "600", "700"],
    variable: false,
  },
  {
    family: "Plus Jakarta Sans",
    category: "sans-serif",
    variants: ["400", "600", "700"],
    variable: false,
  },
  {
    family: "DM Sans",
    category: "sans-serif",
    variants: ["400", "600", "700"],
    variable: true,
  },
  {
    family: "Geist",
    category: "sans-serif",
    variants: ["400", "600", "700"],
    variable: true,
  },
  {
    family: "Oxanium",
    category: "sans-serif",
    variants: ["400", "600", "700"],
    variable: false,
  },
  {
    family: "Architects Daughter",
    category: "handwriting",
    variants: ["400", "600", "700"],
    variable: false,
  },
  // Serif fonts
  {
    family: "Merriweather",
    category: "serif",
    variants: ["400", "600", "700"],
    variable: false,
  },
  {
    family: "Playfair Display",
    category: "serif",
    variants: ["400", "600", "700"],
    variable: true,
  },
  {
    family: "Lora",
    category: "serif",
    variants: ["400", "600", "700"],
    variable: true,
  },
  {
    family: "Source Serif Pro",
    category: "serif",
    variants: ["400", "600", "700"],
    variable: false,
  },
  {
    family: "Libre Baskerville",
    category: "serif",
    variants: ["400", "600", "700"],
    variable: false,
  },
  {
    family: "Space Grotesk",
    category: "serif",
    variants: ["400", "600", "700"],
    variable: false,
  },
  // Monospace fonts
  {
    family: "JetBrains Mono",
    category: "monospace",
    variants: ["400", "600", "700"],
    variable: true,
  },
  {
    family: "Fira Code",
    category: "monospace",
    variants: ["400", "600", "700"],
    variable: true,
  },
  {
    family: "Source Code Pro",
    category: "monospace",
    variants: ["400", "600", "700"],
    variable: false,
  },
  {
    family: "IBM Plex Mono",
    category: "monospace",
    variants: ["400", "600", "700"],
    variable: false,
  },
  {
    family: "Roboto Mono",
    category: "monospace",
    variants: ["400", "600", "700"],
    variable: false,
  },
  {
    family: "Space Mono",
    category: "monospace",
    variants: ["400", "600", "700"],
    variable: false,
  },
  {
    family: "Geist Mono",
    category: "monospace",
    variants: ["400", "600", "700"],
    variable: true,
  },
]

export const SYSTEM_FONTS = [
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
]

export const SYSTEM_FONTS_FALLBACKS: Record<FontCategory, string> = {
  "sans-serif": "ui-sans-serif, sans-serif, system-ui",
  serif: "ui-serif, serif",
  monospace: "ui-monospace, monospace",
  display: "ui-serif, serif",
  handwriting: "cursive",
}

// Build font-family value for CSS.
// e.g. font: "Inter", category: "sans-serif" -> "Inter, ui-sans-serif, sans-serif, system-ui"
export function buildFontFamily(
  fontFamily: string,
  category: FontCategory
): string {
  return `${fontFamily}, ${SYSTEM_FONTS_FALLBACKS[category]}`
}

// Extract font family name from a CSS font-family value.
// e.g. "Inter, ui-sans-serif, system-ui, sans-serif" -> "Inter"
export function extractFontFamily(fontFamilyValue: string): string | null {
  if (!fontFamilyValue) return null

  const firstFont = fontFamilyValue.split(",")[0].trim()
  const cleanFont = firstFont.replace(/['"]/g, "")

  if (SYSTEM_FONTS.includes(cleanFont.toLowerCase())) return null
  return cleanFont
}

// Get default weights for a font based on its available variants.
export function getDefaultWeights(variants: string[]): string[] {
  const weightMap = [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
  ]
  const availableWeights = variants.filter((variant) =>
    weightMap.includes(variant)
  )

  if (availableWeights.length === 0) return ["400"] // Fallback to normal weight

  const preferredWeights = ["400", "500", "600", "700"]
  const selectedWeights = preferredWeights.filter((weight) =>
    availableWeights.includes(weight)
  )

  if (selectedWeights.length === 0) {
    const fallbackWeights = availableWeights.slice(0, 2)
    return fallbackWeights.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
  }

  const finalWeights = [
    ...selectedWeights,
    ...availableWeights.filter((w) => !selectedWeights.includes(w)),
  ].slice(0, 4)

  return finalWeights.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
}

// Check if a font is available using the native document.fonts API.
export function isFontLoaded(family: string, weight = "400"): boolean {
  if (typeof document === "undefined" || !document.fonts) return false
  return document.fonts.check(`${weight} 16px "${family}"`)
}

// Wait for a font to load using the native document.fonts API.
export async function waitForFont(
  family: string,
  weight = "400",
  timeout = 3000
): Promise<boolean> {
  if (typeof document === "undefined" || !document.fonts) return false

  const font = `${weight} 16px "${family}"`

  try {
    await Promise.race([
      document.fonts.load(font),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeout)
      ),
    ])
    return document.fonts.check(font)
  } catch {
    return false
  }
}
