import type { ThemeStyles } from "theme-core"

/**
 * Editor state types, ported from tweakcn `types/editor.ts` but re-based on
 * theme-core's `ThemeStyles` (instead of tweakcn's local `types/theme.ts`).
 */

// Base interface for any editor's state.
export interface BaseEditorState {
  styles: ThemeStyles
}

export interface ThemeEditorState extends BaseEditorState {
  preset?: string
  styles: ThemeStyles
  currentMode: "light" | "dark"
  hslAdjustments?: {
    hueShift: number
    saturationScale: number
    lightnessScale: number
  }
}
