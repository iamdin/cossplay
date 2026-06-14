import { lazy, Suspense, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  FileDown,
  MoreVertical,
  Redo2,
  RotateCcw,
  Shuffle,
  Undo2,
} from "lucide-react"
import { defaultPresets } from "theme-core"

import ContrastChecker from "@/components/editor/contrast-checker"
import ThemeControlPanel from "@/components/editor/theme-control-panel"
// 懒加载:Code 面板内含 react-syntax-highlighter（~1MB），只在打开时才拉取该 chunk。
const CodePanelDialog = lazy(() =>
  import("@/components/editor/code-panel-dialog").then((m) => ({ default: m.CodePanelDialog })),
)
import { CssImportDialog } from "@/components/editor/css-import-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useThemeBridge } from "@/hooks/use-theme-bridge"
import { useEditorStore } from "@/store/editor-store"

const PRESET_OPTIONS = Object.entries(defaultPresets).map(([value, preset]) => ({
  value,
  label: preset.label ?? value,
}))

const PRESET_KEYS = PRESET_OPTIONS.map((p) => p.value)

export function App() {
  useThemeBridge()

  const themeState = useEditorStore((s) => s.themeState)
  const setThemeState = useEditorStore((s) => s.setThemeState)
  const applyThemePreset = useEditorStore((s) => s.applyThemePreset)
  const resetToCurrentPreset = useEditorStore((s) => s.resetToCurrentPreset)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore((s) => s.canUndo)
  const canRedo = useEditorStore((s) => s.canRedo)
  const hasUnsavedChanges = useEditorStore((s) => s.hasUnsavedChanges)

  const [codeOpen, setCodeOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [contrastOpen, setContrastOpen] = useState(false)

  const mode = themeState.currentMode
  const currentPreset = themeState.preset ?? ""
  const dirty = hasUnsavedChanges()

  const switchMode = (m: "light" | "dark") => {
    // currentMode-only change: the bridge subscription toggles `.dark` on the page.
    setThemeState({ ...themeState, currentMode: m })
  }

  const shufflePreset = () => {
    if (PRESET_KEYS.length === 0) return
    const pool = PRESET_KEYS.filter((k) => k !== currentPreset)
    const keys = pool.length > 0 ? pool : PRESET_KEYS
    applyThemePreset(keys[Math.floor(Math.random() * keys.length)])
  }

  const cyclePreset = (dir: 1 | -1) => {
    if (PRESET_KEYS.length === 0) return
    const idx = PRESET_KEYS.indexOf(currentPreset)
    const start = idx === -1 ? 0 : idx
    const next = (start + dir + PRESET_KEYS.length) % PRESET_KEYS.length
    applyThemePreset(PRESET_KEYS[next])
  }

  return (
    <div className="bg-background text-foreground flex h-screen flex-col">
      <header className="flex flex-col gap-2 border-b p-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-semibold">COSS 主题调色</h1>
          <div className="flex items-center gap-1">
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
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button size="icon-sm" variant="ghost" aria-label="更多选项">
                    <MoreVertical />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setContrastOpen(true)}>
                  对比度检查
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => cyclePreset(-1)}
              aria-label="上一个预设"
            >
              <ChevronLeft />
            </Button>
            <select
              value={currentPreset}
              onChange={(e) => {
                if (e.target.value) applyThemePreset(e.target.value)
              }}
              className="bg-input/25 border-input h-7 min-w-0 flex-1 rounded-md border px-2 text-xs outline-none"
            >
              <option value="" disabled>
                选择预设…
              </option>
              {PRESET_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.value === currentPreset && dirty ? `${p.label} *` : p.label}
                </option>
              ))}
            </select>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => cyclePreset(1)}
              aria-label="下一个预设"
            >
              <ChevronRight />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={shufflePreset}
              aria-label="随机预设"
              title="随机预设"
            >
              <Shuffle />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => undo()}
              disabled={!canUndo()}
              aria-label="撤销"
              title="撤销"
            >
              <Undo2 />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => redo()}
              disabled={!canRedo()}
              aria-label="重做"
              title="重做"
            >
              <Redo2 />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => resetToCurrentPreset()}
              disabled={!dirty}
              aria-label="重置"
              title="重置"
            >
              <RotateCcw />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <FileDown />
            导入
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCodeOpen(true)}>
            <Code2 />
            代码
          </Button>
        </div>
      </header>

      <ThemeControlPanel />

      {codeOpen && (
        <Suspense fallback={null}>
          <CodePanelDialog open={codeOpen} onOpenChange={setCodeOpen} />
        </Suspense>
      )}
      <CssImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <ContrastChecker open={contrastOpen} onOpenChange={setContrastOpen} />
    </div>
  )
}

export default App
