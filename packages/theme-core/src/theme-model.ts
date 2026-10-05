/**
 * tweakcn theme data model, used to type the built-in tweakcn presets.
 *
 * Ported from tweakcn `types/theme.ts`. Plain TS types only (no zod). Presets are
 * mapped onto coss ui's own tokens by `coss/theme.ts` (`presetOverrides`).
 */

/** The full ~45-field theme style props (colors + fonts + radius + shadows + spacing/tracking). */
export interface ThemeStyleProps {
  // Colors
  background: string
  foreground: string
  card: string
  "card-foreground": string
  popover: string
  "popover-foreground": string
  primary: string
  "primary-foreground": string
  secondary: string
  "secondary-foreground": string
  muted: string
  "muted-foreground": string
  accent: string
  "accent-foreground": string
  destructive: string
  "destructive-foreground": string
  border: string
  input: string
  ring: string
  "chart-1": string
  "chart-2": string
  "chart-3": string
  "chart-4": string
  "chart-5": string
  sidebar: string
  "sidebar-foreground": string
  "sidebar-primary": string
  "sidebar-primary-foreground": string
  "sidebar-accent": string
  "sidebar-accent-foreground": string
  "sidebar-border": string
  "sidebar-ring": string

  // Fonts
  "font-sans": string
  "font-serif": string
  "font-mono": string

  // Radius
  radius: string

  // Shadow primitives
  "shadow-color": string
  "shadow-opacity": string
  "shadow-blur": string
  "shadow-spread": string
  "shadow-offset-x": string
  "shadow-offset-y": string

  // Typography / spacing
  "letter-spacing": string
  spacing: string
}

export type ThemePreset = {
  source?: "SAVED" | "BUILT_IN"
  createdAt?: string
  label?: string
  styles: {
    light: Partial<ThemeStyleProps>
    dark: Partial<ThemeStyleProps>
  }
}
