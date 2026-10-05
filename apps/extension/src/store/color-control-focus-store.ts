import type { ColorToken } from "@coss-tweak/theme-core/coss"
import { create } from "zustand"

/**
 * Ported from tweakcn `store/color-control-focus-store.ts`. The standalone
 * Zustand store is kept verbatim; the `useColorControlFocus` hook drops
 * tweakcn's Next URL-tab routing (the panel manages the active tab via internal
 * state — C2 will wire tab activation if needed).
 */

export type FocusColorId = ColorToken

interface ColorRefEntry {
  ref: HTMLElement | null
}

interface ColorControlFocusState {
  colorRefs: Map<FocusColorId, ColorRefEntry>
  highlightTarget: FocusColorId | null
  /**
   * Programmatically focus the color control identified by `name`.
   */
  focusColor: (name: FocusColorId) => void
  registerColor: (name: FocusColorId, ref: HTMLElement | null) => void
  unregisterColor: (name: FocusColorId) => void
}

export const useColorControlFocusStore = create<ColorControlFocusState>(
  (set, get) => ({
    colorRefs: new Map(),
    highlightTarget: null,

    registerColor: (name, ref) =>
      set((state) => {
        const map = new Map(state.colorRefs)
        map.set(name, { ref })
        return { colorRefs: map }
      }),

    unregisterColor: (name) =>
      set((state) => {
        const map = new Map(state.colorRefs)
        map.delete(name)
        return { colorRefs: map }
      }),

    focusColor: (name) => {
      const { colorRefs } = get()
      const entry = colorRefs.get(name)
      if (!entry) return

      // Scroll & highlight after a brief delay to ensure expansion has occurred.
      setTimeout(() => {
        if (entry.ref?.scrollIntoView) {
          entry.ref.scrollIntoView({ behavior: "smooth", block: "center" })
        }
        set({ highlightTarget: name })
        setTimeout(() => set({ highlightTarget: null }), 3000)
      }, 175)
    },
  })
)

/**
 * Hook that exposes helper functions for color control focus behaviour.
 */
export const useColorControlFocus = () => {
  const focusColor = (name: FocusColorId) => {
    requestAnimationFrame(() => {
      useColorControlFocusStore.getState().focusColor(name)
    })
  }

  return {
    registerColor: useColorControlFocusStore((s) => s.registerColor),
    unregisterColor: useColorControlFocusStore((s) => s.unregisterColor),
    highlightTarget: useColorControlFocusStore((s) => s.highlightTarget),
    focusColor,
  } as const
}
