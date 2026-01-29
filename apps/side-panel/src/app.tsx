import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import tailwindColorsModule from "tailwindcss/colors"

type ChromeRuntime = {
  sendMessage: (message: unknown, callback?: (response: unknown) => void) => void
  lastError?: { message?: string }
}

type ChromeStorage = {
  local: {
    get: (keys: string[], callback: (result: Record<string, unknown>) => void) => void
  }
}

type ChromeApi = {
  runtime?: ChromeRuntime
  storage?: ChromeStorage
}

const chromeApi: ChromeApi | undefined = (globalThis as { chrome?: ChromeApi }).chrome

const STORAGE_KEY = "cossThemeVars"

type ThemeVarValues = Record<string, string>

type VarsPayload = {
  raw: ThemeVarValues
  computed: ThemeVarValues
  names: string[]
}

const TAILWIND_PALETTES = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const

const TAILWIND_SHADES = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const

type TailwindColorOption = {
  label: string
  value: string
  swatch: string
}

const TAILWIND_COLOR_OPTIONS: TailwindColorOption[] = (() => {
  const tailwindColors: Record<string, Record<string, string> | string> = tailwindColorsModule
  const options: TailwindColorOption[] = []
  const coreNames = ["white", "black"]

  coreNames.forEach((name) => {
    const value = tailwindColors[name]
    if (typeof value === "string") {
      options.push({ label: name, value, swatch: value })
    }
  })

  TAILWIND_PALETTES.forEach((palette) => {
    const paletteValues = tailwindColors[palette]
    if (!paletteValues || typeof paletteValues === "string") {
      return
    }
    TAILWIND_SHADES.forEach((shade) => {
      const colorValue = paletteValues[shade]
      if (!colorValue) {
        return
      }
      options.push({
        label: `${palette}-${shade}`,
        value: colorValue,
        swatch: colorValue,
      })
    })
  })

  return options
})()

const TAILWIND_COLOR_VALUE_SET = new Set(
  TAILWIND_COLOR_OPTIONS.map((option) => option.value)
)

export function App() {
  const [varNames, setVarNames] = React.useState<string[]>([])
  const [values, setValues] = React.useState<ThemeVarValues>({})
  const [originalRaw, setOriginalRaw] = React.useState<ThemeVarValues>({})
  const [originalComputed, setOriginalComputed] = React.useState<ThemeVarValues>({})
  const [status, setStatus] = React.useState<string | null>(null)
  const [needsReload, setNeedsReload] = React.useState(false)

  // Fetch original CSS values from the page
  const fetchOriginalValues = React.useCallback(() => {
    if (!chromeApi?.runtime?.sendMessage) {
      return
    }
    chromeApi.runtime.sendMessage(
      { type: "get-vars" },
      (response: unknown) => {
        // Silently ignore errors on initial load
        if (chromeApi.runtime?.lastError) {
          return
        }
        const payload = response as { ok?: boolean; vars?: VarsPayload }
        if (payload?.ok && payload.vars) {
          setVarNames(payload.vars.names)
          setOriginalRaw(payload.vars.raw)
          setOriginalComputed(payload.vars.computed)
        }
      }
    )
  }, [])

  // Load stored modifications and fetch original values on mount
  React.useEffect(() => {
    // Load previously saved modifications from storage
    if (chromeApi?.storage?.local) {
      chromeApi.storage.local.get([STORAGE_KEY], (result) => {
        const stored = result[STORAGE_KEY] as ThemeVarValues | undefined
        if (stored && typeof stored === "object") {
          setValues(stored)
        }
      })
    }
    fetchOriginalValues()
  }, [fetchOriginalValues])

  const applyUpdate = React.useCallback((nextValues: ThemeVarValues) => {
    if (!chromeApi?.runtime?.sendMessage) {
      return
    }
    chromeApi.runtime.sendMessage({
      type: "set-vars",
      vars: nextValues,
    })
  }, [])

  const handleChange = React.useCallback(
    (name: string, value: string) => {
      setValues((prev) => {
        const next = { ...prev }
        const normalized = value.trim()
        if (!normalized) {
          delete next[name]
        } else {
          next[name] = normalized
        }
        applyUpdate(next)
        return next
      })
    },
    [applyUpdate]
  )

  const handleReset = React.useCallback(() => {
    setValues({})
    if (chromeApi?.runtime?.sendMessage) {
      chromeApi.runtime.sendMessage({ type: "reset-vars" })
    }
  }, [])

  const handleExport = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(values, null, 2))
      setStatus("已复制到剪贴板")
    } catch {
      setStatus("复制失败，请手动复制")
    } finally {
      setTimeout(() => setStatus(null), 2000)
    }
  }, [values])

  const handleFetchCurrent = React.useCallback(() => {
    if (!chromeApi?.runtime?.sendMessage) {
      setStatus("无法访问扩展运行时")
      setTimeout(() => setStatus(null), 3000)
      return
    }
    chromeApi.runtime.sendMessage(
      { type: "get-vars" },
      (response: unknown) => {
        const lastError = chromeApi.runtime?.lastError
        if (lastError?.message) {
          const isConnectionError = lastError.message.includes("Receiving end does not exist")
          if (isConnectionError) {
            setStatus("页面未连接")
            setNeedsReload(true)
          } else {
            setStatus(`读取失败：${lastError.message}`)
            setTimeout(() => setStatus(null), 3000)
          }
          return
        }
        const payload = response as { ok?: boolean; vars?: VarsPayload; error?: string }
        if (!payload?.ok || !payload.vars) {
          setStatus(payload?.error ?? "获取失败，请刷新目标页面")
          setTimeout(() => setStatus(null), 3000)
          return
        }
        setVarNames(payload.vars.names)
        setOriginalRaw(payload.vars.raw)
        setOriginalComputed(payload.vars.computed)
        setNeedsReload(false)
        setStatus("已读取当前页面色值")
        setTimeout(() => setStatus(null), 2000)
      }
    )
  }, [])

  const handleReloadPage = React.useCallback(() => {
    if (!chromeApi?.runtime?.sendMessage) {
      return
    }
    setStatus("正在刷新页面...")
    chromeApi.runtime.sendMessage(
      { type: "reload-target" },
      (response: unknown) => {
        const payload = response as { ok?: boolean; error?: string }
        if (!payload?.ok) {
          setStatus(payload?.error ?? "刷新失败")
          setTimeout(() => setStatus(null), 3000)
          return
        }
        setStatus("页面已刷新，正在重新读取...")
        // Wait for page to reload and content script to initialize
        setTimeout(() => {
          setNeedsReload(false)
          fetchOriginalValues()
        }, 1500)
      }
    )
  }, [fetchOriginalValues])

  return (
    <div className="bg-background text-foreground min-h-screen p-4">
      <header className="space-y-1">
        <h1 className="text-base font-semibold">COSS 主题变量</h1>
        <p className="text-sm text-muted-foreground">
          仅对 https://coss.com/ui/docs 生效
        </p>
      </header>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleReset} disabled={Object.keys(values).length === 0}>
          重置全部
        </Button>
        <Button size="sm" variant="outline" onClick={handleFetchCurrent}>
          读取当前
        </Button>
        <Button size="sm" variant="secondary" onClick={handleExport}>
          导出 JSON
        </Button>
        {status && (
          <span className="text-sm text-muted-foreground">{status}</span>
        )}
        {needsReload && (
          <Button size="sm" variant="destructive" onClick={handleReloadPage}>
            刷新页面
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {varNames.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            请先打开 coss.com/ui/docs 页面
          </p>
        ) : (
          varNames.map((name) => {
            const hasChange = Boolean(values[name])
            return (
              <label
                key={name}
                className={`flex flex-col gap-1.5 text-sm p-2 rounded-md ${hasChange ? "bg-accent" : ""}`}
              >
                <span className="text-foreground font-medium">{name}</span>
                <div className="flex flex-col gap-1 text-xs">
                  {/* Original value */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    {originalComputed[name] && (
                      <span
                        className="size-4 rounded border border-border shrink-0"
                        style={{ backgroundColor: originalComputed[name] }}
                        title={originalComputed[name]}
                      />
                    )}
                    <span className="text-muted-foreground shrink-0">
                      {originalComputed[name] || "-"}
                    </span>
                    {originalRaw[name] && originalRaw[name] !== originalComputed[name] && (
                      <span className="text-muted-foreground/60 truncate" title={originalRaw[name]}>
                        ({originalRaw[name]})
                      </span>
                    )}
                  </div>
                  {/* New value when changed */}
                  {hasChange && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-4 rounded border border-border shrink-0"
                        style={{ backgroundColor: values[name] }}
                        title={values[name]}
                      />
                      <span className="text-primary font-medium truncate" title={values[name]}>
                        {values[name]}
                      </span>
                      <span className="text-primary/60 text-[10px]">new</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Input
                      value={values[name] ?? ""}
                      onChange={(event) =>
                        handleChange(name, event.target.value)
                      }
                    />
                  </div>
                  <Select
                    value={values[name] && TAILWIND_COLOR_VALUE_SET.has(values[name]) ? values[name] : undefined}
                    onValueChange={(value) => value && handleChange(name, value)}
                  >
                    <SelectTrigger className="min-w-36 shrink-0">
                      <SelectValue placeholder="Tailwind 颜色" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {TAILWIND_COLOR_OPTIONS.map((option) => (
                        <SelectItem
                          key={`${option.label}-${option.value}`}
                          value={option.value}
                        >
                          <span
                            className="size-3 rounded border border-border shrink-0"
                            style={{ backgroundColor: option.swatch }}
                          />
                          <span className="text-foreground">{option.label}</span>
                          <span className="text-muted-foreground/70">
                            {option.value}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}

export default App
