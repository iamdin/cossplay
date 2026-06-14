import { defaultPresets } from "theme-core"

import ThemeControlPanel from "@/components/editor/theme-control-panel"
import { Button } from "@/components/ui/button"
import { useThemeBridge } from "@/hooks/use-theme-bridge"
import { useEditorStore } from "@/store/editor-store"

const PRESET_OPTIONS = Object.entries(defaultPresets).map(([value, preset]) => ({
  value,
  label: preset.label ?? value,
}))

export function App() {
  useThemeBridge()

  const themeState = useEditorStore((s) => s.themeState)
  const setThemeState = useEditorStore((s) => s.setThemeState)
  const applyThemePreset = useEditorStore((s) => s.applyThemePreset)
  const restoreThemeCheckpoint = useEditorStore((s) => s.restoreThemeCheckpoint)

  const mode = themeState.currentMode

  const switchMode = (m: "light" | "dark") => {
    // currentMode-only change: the bridge subscription toggles `.dark` on the page.
    setThemeState({ ...themeState, currentMode: m })
  }

  return (
    <div className="bg-background text-foreground flex h-screen flex-col">
      <header className="flex flex-col gap-2 border-b p-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-semibold">COSS 主题调色</h1>
          <div className="flex overflow-hidden rounded-md border">
            {(["light", "dark"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`px-2.5 py-1 text-xs transition-colors ${
                  mode === m ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {m === "light" ? "亮色" : "暗色"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={themeState.preset ?? ""}
            onChange={(e) => {
              if (e.target.value) applyThemePreset(e.target.value)
            }}
            className="bg-input/25 border-input h-8 min-w-0 flex-1 rounded-md border px-2 text-xs outline-none"
          >
            <option value="" disabled>
              选择预设…
            </option>
            {PRESET_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={() => restoreThemeCheckpoint()}>
            重置
          </Button>
        </div>
      </header>

      <ThemeControlPanel />
    </div>
  )
}

export default App
