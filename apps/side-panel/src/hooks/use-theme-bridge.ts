import * as React from "react"
import {
  defaultThemeStyles,
  generateThemeCss,
  normalizeThemeStyles,
} from "theme-core"

import { defaultThemeState, useEditorStore } from "@/store/editor-store"
import type { ThemeEditorState } from "@/types/editor"

/**
 * Bridges the editor store to the live coss page:
 *  1. On mount, auto-discovers coss defaults via `{type:"get-vars"}`：
 *     - 始终把发现到的 coss 默认值刷新为「重置基线」（themeCheckpoint），
 *       让「重置」恢复到 coss 真实默认值；
 *     - 仅在首次（!seeded，即尚无持久化的用户状态）时用默认值播种工作样式并清空
 *       history/future，之后回访不再覆盖用户编辑（用户的 themeState 由 persist 存活）。
 *  2. Subscribes to style changes and pushes generated CSS via `{type:"apply-css"}`
 *     (debounced)。挂载时会先推送当前（可能是持久化的）样式，使主题重新应用到 coss。
 *  3. Toggles `.dark` on the coss page when `currentMode` flips.
 *
 * All chrome calls are guarded so the panel still works outside the extension
 * (e.g. during Playwright "panel renders" tests).
 */

const APPLY_CSS_DEBOUNCE_MS = 120

type DiscoverResult = {
  names: string[]
  light: Record<string, string>
  dark: Record<string, string>
  base: Record<string, string>
}

type ChromeRuntime = {
  sendMessage: (message: unknown, callback?: (response: unknown) => void) => void
  lastError?: { message?: string }
}
type ChromeTabs = {
  query: (
    q: { active: boolean; currentWindow: boolean },
    cb: (tabs: { id?: number }[]) => void
  ) => void
}
type ChromeScripting = {
  executeScript: (injection: {
    target: { tabId: number }
    func: (dark: boolean) => void
    args: [boolean]
  }) => void
}
type ChromeApi = {
  runtime?: ChromeRuntime
  tabs?: ChromeTabs
  scripting?: ChromeScripting
}

const chromeApi = (globalThis as { chrome?: ChromeApi }).chrome

/** Toggle `.dark` on the active coss tab via scripting injection. */
function togglePageDark(dark: boolean) {
  chromeApi?.tabs?.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id == null) return
    chromeApi?.scripting?.executeScript({
      target: { tabId: tab.id },
      func: (isDark: boolean) =>
        document.documentElement.classList.toggle("dark", isDark),
      args: [dark],
    })
  })
}

export function useThemeBridge() {
  // --- 1. Auto-discover coss defaults and seed the store as baseline. ---
  React.useEffect(() => {
    const runtime = chromeApi?.runtime
    if (!runtime) return

    runtime.sendMessage({ type: "get-vars" }, (resp: unknown) => {
      if (runtime.lastError) return
      const payload = resp as { ok?: boolean; vars?: DiscoverResult }
      if (!payload?.ok || !payload.vars) return

      const { base, light, dark } = payload.vars
      const seededStyles = normalizeThemeStyles({ base, light, dark }, defaultThemeStyles)

      const store = useEditorStore.getState()
      const currentMode = store.themeState.currentMode
      const cossDefaultState: ThemeEditorState = {
        ...defaultThemeState,
        styles: seededStyles,
        currentMode,
      }

      if (!store.seeded) {
        // 首次：尚无持久化的用户状态。用 coss 默认值播种工作样式，并清空 history/future；
        // 同时把它作为重置基线。置 seeded=true 后续不再覆盖。
        useEditorStore.setState({
          themeState: cossDefaultState,
          themeCheckpoint: cossDefaultState,
          history: [],
          future: [],
          seeded: true,
        })
      } else {
        // 回访：保留用户的工作样式与 history/future，只把重置基线刷新为 coss 默认值。
        useEditorStore.setState({ themeCheckpoint: cossDefaultState })
      }
    })
  }, [])

  // --- 2. Push generated CSS on style changes (debounced). ---
  React.useEffect(() => {
    const runtime = chromeApi?.runtime
    if (!runtime) return

    let timer: ReturnType<typeof setTimeout> | null = null

    const push = (styles: ThemeEditorState["styles"]) => {
      const css = generateThemeCss(styles, { colorFormat: "oklch" })
      runtime.sendMessage({ type: "apply-css", css })
    }

    const schedule = (styles: ThemeEditorState["styles"]) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => push(styles), APPLY_CSS_DEBOUNCE_MS)
    }

    // Push the initial state once, then on every style change.
    schedule(useEditorStore.getState().themeState.styles)

    const unsubscribe = useEditorStore.subscribe((state, prev) => {
      if (state.themeState.styles !== prev.themeState.styles) {
        schedule(state.themeState.styles)
      }
    })

    return () => {
      if (timer) clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  // --- 3. Toggle `.dark` on the page when currentMode changes. ---
  React.useEffect(() => {
    let prevMode = useEditorStore.getState().themeState.currentMode
    togglePageDark(prevMode === "dark")

    const unsubscribe = useEditorStore.subscribe((state) => {
      const mode = state.themeState.currentMode
      if (mode !== prevMode) {
        prevMode = mode
        togglePageDark(mode === "dark")
      }
    })

    return unsubscribe
  }, [])
}
