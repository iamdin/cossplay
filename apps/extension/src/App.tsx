import { lazy, Suspense, useEffect, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Code2,
  FileDown,
  MoreVertical,
  Power,
  Redo2,
  RotateCcw,
  Shuffle,
  Undo2,
} from "lucide-react"
import { presetOverrides, presets } from "@coss-tweak/theme-core/coss"

import ContrastChecker from "@/components/editor/contrast-checker"
import ThemeControlPanel from "@/components/editor/theme-control-panel"
// 懒加载:Code 面板内含 react-syntax-highlighter（~1MB），只在打开时才拉取该 chunk。
const CodePanelDialog = lazy(() =>
  import("@/components/editor/code-panel-dialog").then((m) => ({ default: m.CodePanelDialog })),
)
import { CssImportDialog } from "@/components/editor/css-import-dialog"
import { LocalThemesDialog } from "@/components/editor/local-themes-dialog"
import { Button } from "@coss-tweak/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@coss-tweak/ui/components/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coss-tweak/ui/components/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@coss-tweak/ui/components/popover"
import { cn } from "@coss-tweak/ui/lib/utils"
import { applyOverrides, connect, dispatch, preview, useSiteStore } from "@/store/site-store"

const PRESET_OPTIONS = Object.entries(presets).map(([value, preset]) => ({
  value,
  label: preset.label ?? value,
}))

const PRESET_KEYS = PRESET_OPTIONS.map((p) => p.value)

export function App() {
  useEffect(connect, [])

  const site = useSiteStore((s) => s.site)
  const ready = useSiteStore((s) => !!s.site && !!s.detection)
  const mode = useSiteStore((s) => s.mode)
  const status = useSiteStore((s) => s.status)
  const error = useSiteStore((s) => s.error)

  const [codeOpen, setCodeOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [contrastOpen, setContrastOpen] = useState(false)
  const [localsOpen, setLocalsOpen] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)

  const currentPreset = site?.current.themeId ?? ""
  const dirty =
    !!site && Object.values(site.current.overrides).some((o) => Object.keys(o).length > 0)
  const presetEdited =
    !!currentPreset &&
    Object.hasOwn(presets, currentPreset) &&
    JSON.stringify(site?.current.overrides) !== JSON.stringify(presetOverrides(currentPreset))
  const currentLabel =
    PRESET_OPTIONS.find((p) => p.value === currentPreset)?.label ?? "选择预设…"

  const applyThemePreset = (id: string) => applyOverrides(presetOverrides(id), id)

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
            <Button
              size="icon-sm"
              variant={site?.enabled === false ? "outline" : "ghost"}
              disabled={!ready}
              onClick={() => dispatch({ kind: "enabled", enabled: site?.enabled === false })}
              aria-label={site?.enabled === false ? "在此网站启用" : "在此网站停用"}
              aria-pressed={site?.enabled !== false}
              title={site?.enabled === false ? "已停用，点击在此网站启用" : "已启用，点击在此网站停用"}
            >
              <Power className={site?.enabled === false ? "opacity-50" : ""} />
            </Button>
            <div className="flex overflow-hidden rounded-md border">
              {(["light", "dark"] as const).map((m) => (
                <button
                  key={m}
                  disabled={!ready}
                  onClick={() => preview(m)}
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
                <DropdownMenuItem disabled={!ready} onClick={() => setContrastOpen(true)}>
                  对比度检查
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!ready} onClick={() => setLocalsOpen(true)}>
                  本地主题
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
              disabled={!ready}
              onClick={() => cyclePreset(-1)}
              aria-label="上一个预设"
            >
              <ChevronLeft />
            </Button>
            <Popover open={presetOpen} onOpenChange={setPresetOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  role="combobox"
                  disabled={!ready}
                  aria-expanded={presetOpen}
                  aria-label="选择预设"
                  className="min-w-0 flex-1 justify-between font-normal"
                >
                  <span className="truncate">
                    {currentLabel}
                    {presetEdited ? " *" : ""}
                  </span>
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-0">
                <Command>
                  <CommandInput placeholder="搜索预设…" className="h-9" />
                  <CommandList>
                    <CommandEmpty>未找到预设</CommandEmpty>
                    <CommandGroup
                      heading={`${PRESET_OPTIONS.length} 个预设`}
                    >
                      {PRESET_OPTIONS.map((p) => (
                        <CommandItem
                          key={p.value}
                          value={p.label}
                          onSelect={() => {
                            applyThemePreset(p.value)
                            setPresetOpen(false)
                          }}
                        >
                          <span className="truncate">{p.label}</span>
                          <Check
                            className={cn(
                              "ml-auto",
                              p.value === currentPreset ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              size="icon-sm"
              variant="outline"
              disabled={!ready}
              onClick={() => cyclePreset(1)}
              aria-label="下一个预设"
            >
              <ChevronRight />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              disabled={!ready}
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
              onClick={() => dispatch({ kind: "undo" })}
              disabled={!site?.past.length}
              aria-label="撤销"
              title="撤销"
            >
              <Undo2 />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => dispatch({ kind: "redo" })}
              disabled={!site?.future.length}
              aria-label="重做"
              title="重做"
            >
              <Redo2 />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => dispatch({ kind: "reset" })}
              disabled={!dirty}
              aria-label="重置"
              title="重置为网站原主题"
            >
              <RotateCcw />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" disabled={!ready} onClick={() => setImportOpen(true)}>
            <FileDown />
            导入
          </Button>
          <Button size="sm" variant="outline" disabled={!ready} onClick={() => setCodeOpen(true)}>
            <Code2 />
            代码
          </Button>
        </div>
        <p role="status" className="text-muted-foreground text-xs">
          {status}
        </p>
        {error && (
          <p role="alert" className="text-destructive text-xs">
            {error}
          </p>
        )}
      </header>

      {ready && <ThemeControlPanel />}

      {codeOpen && (
        <Suspense fallback={null}>
          <CodePanelDialog open={codeOpen} onOpenChange={setCodeOpen} />
        </Suspense>
      )}
      <CssImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <ContrastChecker open={contrastOpen} onOpenChange={setContrastOpen} />
      <LocalThemesDialog open={localsOpen} onOpenChange={setLocalsOpen} />
    </div>
  )
}

export default App
