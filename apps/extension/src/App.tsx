import {
  type ColorFormat,
  clone,
  contrast,
  contrastPairs,
  defaults,
  groups,
  hslPresets,
  presetOverrides,
  presets,
  shadows,
} from "@coss-tweak/theme-core/coss"
import { Button } from "@coss-tweak/ui/components/button"
import { Input } from "@coss-tweak/ui/components/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@coss-tweak/ui/components/tabs"
import { cn } from "@coss-tweak/ui/lib/utils"
import {
  Moon,
  Power,
  Redo2,
  RefreshCcw,
  RotateCcw,
  Sun,
  Undo2,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import {
  ColorControl,
  FontControl,
  NumericControl,
  Section,
  selectClass,
} from "@/components/controls"
import { ExportDialog, ImportDialog } from "@/components/dialogs"
import {
  adjust,
  applyOverrides,
  connect,
  dispatch,
  fontTokens,
  loadFont,
  preview,
  reset,
  setError,
  syncSidebar,
  themeOp,
  updateToken,
  useSiteStore,
  useTheme,
} from "@/store/site-store"

const hslControls = [
  { key: "hue", label: "Hue shift", min: -180, max: 180, step: 1 },
  { key: "saturation", label: "Saturation scale", min: 0, max: 2, step: 0.01 },
  { key: "lightness", label: "Lightness scale", min: 0.2, max: 2, step: 0.01 },
] as const
const shadowTokens = [
  "shadow-opacity",
  "shadow-blur",
  "shadow-spread",
  "shadow-offset-x",
  "shadow-offset-y",
] as const
const muted = "text-[10px] leading-relaxed text-muted-foreground"

export function App() {
  useEffect(connect, [])
  const site = useSiteStore((s) => s.site)
  const detection = useSiteStore((s) => s.detection)
  const mode = useSiteStore((s) => s.mode)
  const status = useSiteStore((s) => s.status)
  const error = useSiteStore((s) => s.error)
  const locals = useSiteStore((s) => s.locals)
  const theme = useTheme() ?? defaults
  const styles = theme[mode]
  const detected = !!detection?.detected
  const [format, setFormat] = useState<ColorFormat>("hex")
  const [search, setSearch] = useState("")
  const [issuesOnly, setIssuesOnly] = useState(false)
  const [name, setName] = useState("")
  const [dialog, setDialog] = useState<"import" | "export" | null>(null)

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.key.toLowerCase() !== "z" ||
        (event.target instanceof HTMLElement &&
          event.target.matches("input,textarea"))
      )
        return
      event.preventDefault()
      dispatch({ kind: event.shiftKey ? "redo" : "undo" })
    }
    document.addEventListener("keydown", keydown)
    return () => document.removeEventListener("keydown", keydown)
  }, [])

  const applyPreset = (id: string) => {
    try {
      applyOverrides(presetOverrides(id), id)
    } catch (e) {
      setError(String(e))
    }
  }
  const matches = (group: string, key: string) =>
    `${group} ${key}`.toLowerCase().includes(search.toLowerCase())

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground text-xs">
      <div className="sticky top-0 z-10 flex items-center gap-1 border-b bg-background px-3 py-2">
        <select
          aria-label="Theme preset"
          className={cn(selectClass, "min-w-0 flex-1")}
          disabled={!detected}
          value={site?.current.themeId ?? ""}
          onChange={(e) =>
            e.currentTarget.value && applyPreset(e.currentTarget.value)
          }
        >
          <option value="">Custom</option>
          <option value="default">Default coss</option>
          {Object.entries(presets).map(([id, preset]) => (
            <option key={id} value={id}>
              {preset.label}
            </option>
          ))}
        </select>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Reset preset"
          title="Discard edits to this preset"
          disabled={!detected || !site?.current.themeId}
          onClick={() =>
            site?.current.themeId && applyPreset(site.current.themeId)
          }
        >
          <RefreshCcw />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={mode === "light" ? "Preview dark" : "Preview light"}
          title={mode === "light" ? "Preview dark" : "Preview light"}
          disabled={!detected}
          onClick={() => preview(mode === "light" ? "dark" : "light")}
        >
          {mode === "light" ? <Moon /> : <Sun />}
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Undo"
          title="Undo · ⌘Z"
          disabled={!site?.past.length}
          onClick={() => dispatch({ kind: "undo" })}
        >
          <Undo2 />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Redo"
          title="Redo · ⌘⇧Z"
          disabled={!site?.future.length}
          onClick={() => dispatch({ kind: "redo" })}
        >
          <Redo2 />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Reset site"
          title="Back to the site's own theme"
          disabled={!site}
          onClick={reset}
        >
          <RotateCcw />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Enable theme for this site"
          aria-pressed={site?.enabled ?? false}
          title={`${site?.enabled ? "Theme on" : "Theme off"} · ${site?.origin ?? ""}`}
          className="aria-pressed:text-emerald-600"
          disabled={!detected}
          onClick={() => dispatch({ kind: "enabled", enabled: !site?.enabled })}
        >
          <Power />
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="relative mx-3 my-2 border border-destructive/30 bg-destructive/5 py-2.5 pr-7 pl-3 text-[11px] text-destructive [overflow-wrap:anywhere]"
        >
          {error}
          <button
            type="button"
            aria-label="Dismiss error"
            className="absolute top-1.5 right-1.5 p-1"
            onClick={() => setError("")}
          >
            <X className="size-3" />
          </button>
        </div>
      )}
      {detection?.warnings.length ? (
        <details className="mx-4 my-2 text-[10px] text-amber-700">
          <summary>Stylesheet warnings</summary>
          {detection.warnings.map((w) => (
            <p key={w} className="mt-1 [overflow-wrap:anywhere]">
              {w}
            </p>
          ))}
        </details>
      ) : null}

      <fieldset disabled={!detected} className="flex min-w-0 flex-1 flex-col">
        <Tabs defaultValue="colors" className="flex-1 gap-0">
          <TabsList
            aria-label="Editor sections"
            className="mx-3 my-2 grid w-auto grid-cols-4"
          >
            <TabsTrigger value="colors" className="text-[11px]">
              Colors
            </TabsTrigger>
            <TabsTrigger value="typography" className="text-[11px]">
              Typography
            </TabsTrigger>
            <TabsTrigger value="other" className="text-[11px]">
              Other
            </TabsTrigger>
            <TabsTrigger value="themes" className="text-[11px]">
              My themes
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="colors"
            className="mt-0 border-t px-4 pt-3.5 pb-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <Input
                aria-label="Search colors"
                placeholder="Search colors…"
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
              />
              <select
                aria-label="Color format"
                className={cn(selectClass, "w-20 font-semibold text-[10px]")}
                value={format}
                onChange={(e) =>
                  setFormat(e.currentTarget.value as ColorFormat)
                }
              >
                <option value="hex">HEX</option>
                <option value="oklch">OKLCH</option>
                <option value="hsl">HSL</option>
                <option value="rgb">RGB</option>
              </select>
            </div>
            {Object.entries(groups).map(([group, keys]) => {
              const filtered = keys.filter((k) => !search || matches(group, k))
              return (
                filtered.length > 0 && (
                  <Section
                    key={`${group}-${!!search}`}
                    label={group}
                    count={filtered.length}
                    open={
                      !!search || group === "Primary" || group === "Secondary"
                    }
                  >
                    {group === "Sidebar" && (
                      <label className="flex items-center gap-1.5 px-3 py-2 text-[10px] text-muted-foreground">
                        <input
                          type="checkbox"
                          aria-label="Sync sidebar colors"
                          className="accent-primary"
                          checked={site?.current.sidebarSync ?? false}
                          onChange={syncSidebar}
                        />
                        Sync sidebar to base colors
                      </label>
                    )}
                    {filtered.map((token) => (
                      <ColorControl
                        key={token}
                        token={token}
                        value={styles[token]}
                        format={format}
                        onChange={(value) => updateToken(token, value)}
                      />
                    ))}
                  </Section>
                )
              )
            })}
            {search &&
              !Object.entries(groups).some(([g, keys]) =>
                keys.some((k) => matches(g, k))
              ) && <p className={muted}>No matching colors.</p>}
            <Section label="Contrast checker" count="WCAG">
              <p className={cn(muted, "mx-3 my-2.5")}>
                AA normal text ≥ 4.5:1 · large text ≥ 3:1 · AAA ≥ 7:1
              </p>
              <label className="flex items-center gap-1.5 px-3 py-2 text-[10px] text-muted-foreground">
                <input
                  type="checkbox"
                  aria-label="Show contrast issues only"
                  className="accent-primary"
                  checked={issuesOnly}
                  onChange={(e) => setIssuesOnly(e.currentTarget.checked)}
                />
                Show issues only
              </label>
              {contrastPairs.map(({ label, foreground, background }) => {
                const ratio = contrast(
                  styles[foreground],
                  styles[background],
                  mode === "dark" ? "#000" : "#fff"
                )
                if (issuesOnly && ratio >= 4.5) return null
                return (
                  <div
                    key={label}
                    className="flex justify-between px-3 py-1.5 text-[10px]"
                  >
                    <span>{label}</span>
                    <output
                      className={
                        ratio < 4.5
                          ? "text-destructive"
                          : "text-emerald-700 dark:text-emerald-400"
                      }
                    >
                      {ratio.toFixed(2)}:1 ·{" "}
                      {ratio < 4.5
                        ? "AA fail"
                        : ratio < 7
                          ? "AA pass"
                          : "AAA pass"}
                    </output>
                  </div>
                )
              })}
            </Section>
          </TabsContent>

          <TabsContent
            value="typography"
            className="mt-0 border-t px-4 pt-3.5 pb-4"
          >
            <p className={cn(muted, "mb-3")}>
              Typography and geometry are shared between light and dark, like
              tweakcn. Custom fonts need to be installed or loaded.
            </p>
            <section className="mb-2 border bg-card p-3">
              <h2 className="pb-3 font-semibold text-xs">Font family</h2>
              {fontTokens.map((token) => (
                <FontControl
                  key={token}
                  token={token}
                  value={styles[token]}
                  onChange={(v) => updateToken(token, v)}
                  onLoad={loadFont}
                />
              ))}
            </section>
            <section className="mb-2 border bg-card p-3">
              <h2 className="pb-3 font-semibold text-xs">Letter spacing</h2>
              <NumericControl
                token="letter-spacing"
                value={styles["letter-spacing"]}
                onChange={(v) => updateToken("letter-spacing", v)}
              />
            </section>
          </TabsContent>

          <TabsContent value="other" className="mt-0 border-t px-4 pt-3.5 pb-4">
            <Section label="HSL adjustments" open>
              <p className={cn(muted, "mx-3 my-2.5")}>
                Adjust all colors in both modes from one checkpoint.
              </p>
              <div className="mx-3 my-2.5 flex flex-wrap gap-1">
                {hslPresets.map((p) => (
                  <Button
                    key={p.label}
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      adjust({
                        hue: p.hueShift,
                        saturation: p.saturationScale,
                        lightness: p.lightnessScale,
                      })
                    }
                  >
                    {p.label}
                  </Button>
                ))}
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    adjust({ hue: 0, saturation: 1, lightness: 1 })
                  }
                >
                  Reset HSL
                </Button>
              </div>
              {hslControls.map((c) => (
                <label
                  key={c.key}
                  className="m-3 block text-[11px] text-muted-foreground"
                >
                  {c.label}
                  <div className="flex items-center gap-2.5">
                    <input
                      type="range"
                      aria-label={c.label}
                      className="h-5 min-w-0 flex-1 accent-primary"
                      min={c.min}
                      max={c.max}
                      step={c.step}
                      value={
                        site?.current.hsl[c.key] ?? (c.key === "hue" ? 0 : 1)
                      }
                      onChange={(e) =>
                        site &&
                        adjust(
                          {
                            ...site.current.hsl,
                            [c.key]: Number(e.currentTarget.value),
                          },
                          true
                        )
                      }
                    />
                    <output className="min-w-8 text-right text-foreground">
                      {site?.current.hsl[c.key]}
                    </output>
                  </div>
                </label>
              ))}
            </Section>
            <section className="mb-2 border bg-card p-3">
              <h2 className="pb-3 font-semibold text-xs">Radius & spacing</h2>
              {(["radius", "spacing"] as const).map((token) => (
                <NumericControl
                  key={token}
                  token={token}
                  value={styles[token]}
                  onChange={(v) => updateToken(token, v)}
                />
              ))}
            </section>
            <Section label="Shadows" open>
              <ColorControl
                token="shadow-color"
                value={styles["shadow-color"]}
                format={format}
                onChange={(v) => updateToken("shadow-color", v)}
              />
              <div className="p-3">
                {shadowTokens.map((token) => (
                  <NumericControl
                    key={token}
                    token={token}
                    value={styles[token]}
                    onChange={(v) => updateToken(token, v)}
                  />
                ))}
              </div>
              <div className="flex justify-around gap-2 px-2 py-4">
                {["2xs", "sm", "md", "xl"].map((size) => (
                  <div
                    key={size}
                    className="bg-background px-1.5 py-3 text-[8px]"
                    style={{ boxShadow: shadows(styles)[`shadow-${size}`] }}
                  >
                    shadow-{size}
                  </div>
                ))}
              </div>
            </Section>
          </TabsContent>

          <TabsContent
            value="themes"
            className="mt-0 border-t px-4 pt-3.5 pb-4"
          >
            <section className="mb-2 border bg-card p-3">
              <h2 className="pb-1 font-semibold text-xs">Save locally</h2>
              <p className={cn(muted, "mb-2")}>
                No account. Themes stay in this browser.
              </p>
              <div className="flex gap-2">
                <Input
                  aria-label="Local theme name"
                  placeholder="Theme name"
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.currentTarget.value)}
                />
                <Button
                  onClick={() => {
                    if (!name.trim()) return setError("Enter a theme name")
                    themeOp({
                      kind: "add",
                      name: name.trim(),
                      theme: clone(theme),
                    })
                    setName("")
                  }}
                >
                  Save
                </Button>
              </div>
            </section>
            {locals.map((local) => (
              <section
                key={`${local.id}:${local.name}`}
                className="mb-2 border bg-card p-3"
              >
                <Input
                  aria-label={`Rename ${local.name}`}
                  maxLength={100}
                  defaultValue={local.name}
                  onBlur={(e) => {
                    const n = e.currentTarget.value.trim()
                    if (!n) {
                      e.currentTarget.value = local.name
                      return setError("Theme name cannot be empty")
                    }
                    if (n !== local.name)
                      themeOp({ kind: "rename", id: local.id, name: n })
                  }}
                />
                <div className="mt-2 flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyOverrides(clone(local.theme))}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Delete “${local.name}”?`))
                        themeOp({ kind: "delete", id: local.id })
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </section>
            ))}
            {!locals.length && (
              <p className={muted}>Your saved themes will appear here.</p>
            )}
          </TabsContent>
        </Tabs>
      </fieldset>

      <footer className="sticky bottom-0 z-10 flex items-center gap-2 border-t bg-background px-3 py-2">
        <div
          role="status"
          className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground"
          title={site?.origin}
        >
          {detected ? status : (site?.origin ?? "No website selected")}
          {!detected && site ? ` · ${status}` : ""}
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={!detected}
          onClick={() => setDialog("import")}
        >
          Import
        </Button>
        <Button
          size="sm"
          disabled={!detected}
          onClick={() => setDialog("export")}
        >
          Export
        </Button>
      </footer>

      <ImportDialog
        open={dialog === "import"}
        onOpenChange={(open) => setDialog(open ? "import" : null)}
      />
      <ExportDialog
        open={dialog === "export"}
        onOpenChange={(open) => setDialog(open ? "export" : null)}
        theme={theme}
      />
    </div>
  )
}

export default App
