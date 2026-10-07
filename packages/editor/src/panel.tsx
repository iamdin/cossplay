import {
  type ColorFormat,
  contrast,
  contrastPairs,
  defaults,
  effective,
  groups,
  hslPresets,
  presetOverrides,
  presets,
  shadows,
} from "@cossplay/core/coss"
import { Button } from "@cossplay/ui/components/button"
import { Input } from "@cossplay/ui/components/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@cossplay/ui/components/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@cossplay/ui/components/tabs"
import { cn } from "@cossplay/ui/lib/utils"
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
import { ColorControl, FontControl, NumericControl, Section } from "./controls"
import { ExportDialog, ImportDialog } from "./dialogs"
import { InspectToggle } from "./inspect"
import {
  adjust,
  applyOverrides,
  dispatch,
  fontTokens,
  loadFont,
  preview,
  reset,
  setError,
  syncSidebar,
  updateToken,
  usePanelStore,
  useTheme,
} from "./store"

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
const formatItems: { value: ColorFormat; label: string }[] = [
  { value: "hex", label: "HEX" },
  { value: "oklch", label: "OKLCH" },
  { value: "hsl", label: "HSL" },
  { value: "rgb", label: "RGB" },
]
const muted = "text-[10px] leading-relaxed text-muted-foreground"

function usePanel() {
  const site = usePanelStore((s) => s.site)
  const detection = usePanelStore((s) => s.detection)
  const mode = usePanelStore((s) => s.mode)
  return { site, detection, mode, detected: !!detection?.detected }
}

function applyPreset(id: string) {
  try {
    applyOverrides(presetOverrides(id), id)
  } catch (e) {
    setError(String(e))
  }
}

/** ⌘Z / ⌘⇧Z outside text fields. */
export function useUndoShortcuts() {
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
}

const swatchTokens = ["primary", "secondary", "accent", "border"] as const
const presetItems = [
  { value: "default", label: "Default coss" },
  ...Object.entries(presets).map(([value, { label }]) => ({ value, label })),
]
const presetSwatches = new Map<string, string[]>()
function swatchesOf(id: string) {
  let colors = presetSwatches.get(id)
  if (!colors) {
    const light = effective(defaults, presetOverrides(id)).light
    colors = swatchTokens.map((token) => light[token])
    presetSwatches.set(id, colors)
  }
  return colors
}

function Swatches({ colors }: { colors: string[] }) {
  return (
    <span className="flex shrink-0 gap-0.5">
      {colors.map((color, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed token order
          key={i}
          className="size-3 rounded-sm border border-black/10"
          style={{ background: color }}
        />
      ))}
    </span>
  )
}

/** Preset picker and "discard edits to this preset". */
export function PresetSelect() {
  const { site, mode, detected } = usePanel()
  const theme = useTheme()
  const themeId = site?.current.themeId ?? ""
  const overrides = site?.current.overrides
  const edited =
    !!overrides &&
    Object.keys(overrides.light).length + Object.keys(overrides.dark).length > 0
  return (
    <>
      <Select
        items={[
          {
            value: "",
            label: edited ? "Custom" : "Choose a preset",
          },
          ...presetItems,
        ]}
        value={themeId}
        disabled={!detected}
        onValueChange={(id) => id && applyPreset(id)}
      >
        <SelectTrigger
          size="sm"
          aria-label="Theme preset"
          className="min-w-0 flex-1 text-sm"
        >
          {theme && (
            <Swatches colors={swatchTokens.map((t) => theme[mode][t])} />
          )}
          <SelectValue />
        </SelectTrigger>
        <SelectPopup alignItemWithTrigger={false} className="ui-chrome">
          {presetItems.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              <span className="flex items-center gap-2">
                <Swatches colors={swatchesOf(value)} />
                {label}
              </span>
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
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
    </>
  )
}

/** Light/dark preview, undo/redo and reset; `liveSite` adds the per-site on/off switch. */
export function HistoryActions({ liveSite = false }: { liveSite?: boolean }) {
  const { site, mode, detected } = usePanel()
  return (
    <>
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
        aria-label={liveSite ? "Reset site" : "Reset theme"}
        title={
          liveSite ? "Back to the site's own theme" : "Back to coss ui's theme"
        }
        disabled={!site}
        onClick={reset}
      >
        <RotateCcw />
      </Button>
      {liveSite && (
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
      )}
    </>
  )
}

export function PanelAlerts() {
  const error = usePanelStore((s) => s.error)
  const detection = usePanelStore((s) => s.detection)
  return (
    <>
      {error && (
        <div
          role="alert"
          className="relative mx-2 my-2 border border-destructive/30 bg-destructive/5 py-2.5 pr-7 pl-3 text-[11px] text-destructive [overflow-wrap:anywhere]"
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
        <details className="mx-2 my-2 text-[10px] text-amber-700">
          <summary>Stylesheet warnings</summary>
          {detection.warnings.map((w) => (
            <p key={w} className="mt-1 [overflow-wrap:anywhere]">
              {w}
            </p>
          ))}
        </details>
      ) : null}
    </>
  )
}

/** The Colors / Typography / Other tabs. */
export function PanelSections() {
  const { site, mode, detected } = usePanel()
  const theme = useTheme() ?? defaults
  const styles = theme[mode]
  const [format, setFormat] = useState<ColorFormat>("hex")
  const [search, setSearch] = useState("")
  const [issuesOnly, setIssuesOnly] = useState(false)
  const matches = (group: string, key: string) =>
    `${group} ${key}`.toLowerCase().includes(search.toLowerCase())
  return (
    <fieldset
      disabled={!detected}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <Tabs defaultValue="colors" className="min-h-0 flex-1 gap-0">
        <TabsList
          aria-label="Editor sections"
          className="mx-2 my-1.5 grid w-auto shrink-0 grid-cols-3"
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
        </TabsList>

        <TabsContent
          value="colors"
          className="mt-0 min-h-0 flex-1 overflow-y-auto border-t px-2 pt-2 pb-3"
        >
          <div className="mb-3 flex items-center gap-2">
            <Input
              className="text-sm"
              size="sm"
              aria-label="Search colors"
              placeholder="Search colors…"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
            <Select
              items={formatItems}
              value={format}
              onValueChange={(value) => value && setFormat(value)}
            >
              <SelectTrigger
                size="sm"
                aria-label="Color format"
                className="w-24 min-w-0 text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectPopup className="ui-chrome">
                {formatItems.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
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
                    <label className="flex items-center gap-1.5 px-2 py-2 text-[10px] text-muted-foreground">
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
            <p className={cn(muted, "mx-2 my-2")}>
              AA normal text ≥ 4.5:1 · large text ≥ 3:1 · AAA ≥ 7:1
            </p>
            <label className="flex items-center gap-1.5 px-2 py-2 text-[10px] text-muted-foreground">
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
                  className="flex justify-between px-2 py-1.5 text-[10px]"
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
          className="mt-0 min-h-0 flex-1 overflow-y-auto border-t px-2 pt-2 pb-3"
        >
          <p className={cn(muted, "mb-3")}>
            Typography and geometry are shared between light and dark, like
            tweakcn. Custom fonts need to be installed or loaded.
          </p>
          <section className="mb-2 border bg-card p-2">
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
          <section className="mb-2 border bg-card p-2">
            <h2 className="pb-3 font-semibold text-xs">Letter spacing</h2>
            <NumericControl
              token="letter-spacing"
              value={styles["letter-spacing"]}
              onChange={(v) => updateToken("letter-spacing", v)}
            />
          </section>
        </TabsContent>

        <TabsContent
          value="other"
          className="mt-0 min-h-0 flex-1 overflow-y-auto border-t px-2 pt-2 pb-3"
        >
          <Section label="HSL adjustments" open>
            <p className={cn(muted, "mx-2 my-2")}>
              Adjust all colors in both modes from one checkpoint.
            </p>
            <div className="mx-2 my-2 flex flex-wrap gap-1">
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
                onClick={() => adjust({ hue: 0, saturation: 1, lightness: 1 })}
              >
                Reset HSL
              </Button>
            </div>
            {hslControls.map((c) => (
              <label
                key={c.key}
                className="m-2 block text-[11px] text-muted-foreground"
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
          <section className="mb-2 border bg-card p-2">
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
            <div className="p-2">
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
      </Tabs>
    </fieldset>
  )
}

export function ImportExport() {
  const { detected } = usePanel()
  const theme = useTheme() ?? defaults
  const [dialog, setDialog] = useState<"import" | "export" | null>(null)
  return (
    <>
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
      <ImportDialog
        open={dialog === "import"}
        onOpenChange={(open) => setDialog(open ? "import" : null)}
      />
      <ExportDialog
        open={dialog === "export"}
        onOpenChange={(open) => setDialog(open ? "export" : null)}
        theme={theme}
      />
    </>
  )
}

/** The editing controls as one column (the extension's side panel). */
export function Panel({ liveSite = false }: { liveSite?: boolean }) {
  const { site, detected } = usePanel()
  const status = usePanelStore((s) => s.status)
  useUndoShortcuts()
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background text-foreground text-xs">
      <div className="shrink-0 border-b px-2 py-1.5">
        <div className="flex items-center gap-1">
          <PresetSelect />
        </div>
        <div className="mt-1 flex items-center justify-end gap-1">
          {liveSite && <InspectToggle />}
          <HistoryActions liveSite={liveSite} />
        </div>
      </div>
      <PanelAlerts />
      <PanelSections />
      <footer className="flex shrink-0 items-center gap-2 border-t px-2 py-1.5">
        <div
          role="status"
          className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground"
          title={site?.origin}
        >
          {detected ? status : (site?.origin ?? "No website selected")}
          {!detected && site ? ` · ${status}` : ""}
        </div>
        <ImportExport />
      </footer>
    </div>
  )
}
