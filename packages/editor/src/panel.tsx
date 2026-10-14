import {
  type ColorFormat,
  contrast,
  contrastPairs,
  defaults,
  effective,
  groups,
  hslPresets,
  type Overrides,
  presetOverrides,
  presets,
  shadows,
} from "@cossplay/core/coss"
import { Button } from "@cossplay/ui/components/button"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@cossplay/ui/components/combobox"
import { Input } from "@cossplay/ui/components/input"
import {
  Select,
  SelectButton,
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
  ChevronLeft,
  ChevronRight,
  Moon,
  Plug,
  Power,
  Redo2,
  RefreshCcw,
  RotateCcw,
  Search,
  Shuffle,
  Sun,
  Undo2,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import {
  ColorControl,
  FontControl,
  groupLabel,
  NumericControl,
  Section,
} from "./controls"

export { groupLabel }

import { ExportDialog, ImportDialog, McpDialog } from "./dialogs"
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
  { key: "hue", label: "色相偏移", min: -180, max: 180, step: 1 },
  { key: "saturation", label: "饱和度缩放", min: 0, max: 2, step: 0.01 },
  { key: "lightness", label: "明度缩放", min: 0.2, max: 2, step: 0.01 },
] as const
const hslPresetLabels: Record<string, string> = {
  "Hue (-120°)": "色相 −120°",
  "Hue (-60°)": "色相 −60°",
  "Hue (+60°)": "色相 +60°",
  "Hue (+120°)": "色相 +120°",
  "Hue Invert": "色相反转",
  Grayscale: "灰度",
  Muted: "降低饱和",
  Vibrant: "提高饱和",
  Dimmer: "变暗",
  Brighter: "变亮",
  "H(+30) S(-50) L(-5%)": "色相+30 饱和−50 明度−5%",
  "H(-20) S(+20) L(+5%)": "色相−20 饱和+20 明度+5%",
  "H(+20) S(-30) L(-5%)": "色相+20 饱和−30 明度−5%",
  "H(-10) S(-25) L(+10%)": "色相−10 饱和−25 明度+10%",
  "H(+60) S(+50) L(+10%)": "色相+60 饱和+50 明度+10%",
}
const hslPresetLabel = (label: string) => hslPresetLabels[label] ?? label
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

/** 文本框外的 ⌘Z / ⌘⇧Z。 */
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
  { value: "default", label: "coss 默认" },
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
          // biome-ignore lint/suspicious/noArrayIndexKey: token 顺序固定
          key={i}
          className="size-3 rounded-sm border border-black/10"
          style={{ background: color }}
        />
      ))}
    </span>
  )
}

/** 预设选择：搜索、上一个 / 下一个 / 随机，以及丢弃对该预设的修改。 */
export function PresetSelect() {
  const { site, mode, detected } = usePanel()
  const theme = useTheme()
  const themeId = site?.current.themeId ?? ""
  const overrides = site?.current.overrides
  const index = presetItems.findIndex((item) => item.value === themeId)
  // 预设之上的修改，或根本没有预设的主题。
  const custom =
    !!overrides &&
    (index < 0
      ? Object.keys(overrides.light).length +
          Object.keys(overrides.dark).length >
        0
      : !sameOverrides(overrides, presetOverrides(themeId)))
  const step = (by: number) =>
    applyPreset(
      presetItems[(index + by + presetItems.length) % presetItems.length].value
    )
  const random = () => {
    const others = presetItems.filter((item) => item.value !== themeId)
    applyPreset(others[Math.floor(Math.random() * others.length)].value)
  }
  return (
    <>
      <Combobox
        items={presetItems}
        value={presetItems[index] ?? null}
        disabled={!detected}
        onValueChange={(item) => item && applyPreset(item.value)}
      >
        <ComboboxTrigger
          aria-label="主题预设"
          render={<SelectButton size="sm" className="min-w-0 flex-1 text-sm" />}
        >
          <span className="flex min-w-0 items-center gap-2">
            {theme && (
              <Swatches colors={swatchTokens.map((t) => theme[mode][t])} />
            )}
            <span className="truncate">
              {custom ? "自定义" : <ComboboxValue placeholder="选择预设" />}
            </span>
          </span>
        </ComboboxTrigger>
        <ComboboxPopup aria-label="主题预设" className="ui-chrome">
          <div className="border-b p-2">
            <ComboboxInput
              size="sm"
              className="rounded-md text-sm before:rounded-[calc(var(--radius-md)-1px)]"
              placeholder="搜索预设…"
              showTrigger={false}
              startAddon={<Search />}
            />
          </div>
          <ComboboxEmpty>没有匹配的预设。</ComboboxEmpty>
          <ComboboxList>
            {(item: (typeof presetItems)[number]) => (
              <ComboboxItem key={item.value} value={item}>
                <span className="flex items-center gap-2">
                  <Swatches colors={swatchesOf(item.value)} />
                  {item.label}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="上一个预设"
        title="上一个预设"
        disabled={!detected}
        onClick={() => step(index < 0 ? 0 : -1)}
      >
        <ChevronLeft />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="下一个预设"
        title="下一个预设"
        disabled={!detected}
        onClick={() => step(1)}
      >
        <ChevronRight />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="随机预设"
        title="随机预设"
        disabled={!detected}
        onClick={random}
      >
        <Shuffle />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="重置预设"
        title="丢弃对该预设的修改"
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

/** 浅色/深色预览、撤销/重做与重置；`liveSite` 再加上按站点开关。 */
export function HistoryActions({ liveSite = false }: { liveSite?: boolean }) {
  const { site, mode, detected } = usePanel()
  return (
    <>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={mode === "light" ? "预览深色" : "预览浅色"}
        title={mode === "light" ? "预览深色" : "预览浅色"}
        disabled={!detected}
        onClick={() => preview(mode === "light" ? "dark" : "light")}
      >
        {mode === "light" ? <Moon /> : <Sun />}
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="撤销"
        title="撤销 · ⌘Z"
        disabled={!site?.past.length}
        onClick={() => dispatch({ kind: "undo" })}
      >
        <Undo2 />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="重做"
        title="重做 · ⌘⇧Z"
        disabled={!site?.future.length}
        onClick={() => dispatch({ kind: "redo" })}
      >
        <Redo2 />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={liveSite ? "重置站点" : "重置主题"}
        title={liveSite ? "恢复该站点自己的主题" : "恢复 coss ui 的主题"}
        disabled={!site}
        onClick={reset}
      >
        <RotateCcw />
      </Button>
      {liveSite && (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="为此站点启用主题"
          aria-pressed={site?.enabled ?? false}
          title={`${site?.enabled ? "主题开" : "主题关"} · ${site?.origin ?? ""}`}
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
            aria-label="关闭错误"
            className="absolute top-1.5 right-1.5 p-1"
            onClick={() => setError("")}
          >
            <X className="size-3" />
          </button>
        </div>
      )}
      {detection?.warnings.length ? (
        <details className="mx-2 my-2 text-[10px] text-amber-700">
          <summary>样式表警告</summary>
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

/** 颜色 / 排版 / 其他。 */
export function PanelSections() {
  const { site, mode, detected } = usePanel()
  const theme = useTheme() ?? defaults
  const styles = theme[mode]
  const [format, setFormat] = useState<ColorFormat>("hex")
  const search = usePanelStore((s) => s.search)
  const [issuesOnly, setIssuesOnly] = useState(false)
  const matches = (group: string, key: string) =>
    `${groupLabel(group)} ${group} ${key}`
      .toLowerCase()
      .includes(search.toLowerCase())
  return (
    <fieldset
      disabled={!detected}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <Tabs defaultValue="colors" className="min-h-0 flex-1 gap-0">
        <TabsList
          aria-label="编辑分区"
          className="mx-2 my-1.5 grid w-auto shrink-0 grid-cols-3"
        >
          <TabsTrigger value="colors" className="text-[11px]">
            颜色
          </TabsTrigger>
          <TabsTrigger value="typography" className="text-[11px]">
            排版
          </TabsTrigger>
          <TabsTrigger value="other" className="text-[11px]">
            其他
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
              aria-label="搜索颜色"
              placeholder="搜索颜色…"
              value={search}
              onChange={(e) =>
                usePanelStore.setState({ search: e.currentTarget.value })
              }
            />
            <Select
              items={formatItems}
              value={format}
              onValueChange={(value) => value && setFormat(value)}
            >
              <SelectTrigger
                size="sm"
                aria-label="颜色格式"
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
                  label={groupLabel(group)}
                  count={filtered.length}
                  open={
                    !!search || group === "Primary" || group === "Secondary"
                  }
                >
                  {group === "Sidebar" && (
                    <label className="flex items-center gap-1.5 px-2 py-2 text-[10px] text-muted-foreground">
                      <input
                        type="checkbox"
                        aria-label="同步侧栏颜色"
                        className="accent-primary"
                        checked={site?.current.sidebarSync ?? false}
                        onChange={syncSidebar}
                      />
                      侧栏颜色与基础色同步
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
            ) && <p className={muted}>没有匹配的颜色。</p>}
          <Section label="对比度检查" count="WCAG">
            <p className={cn(muted, "mx-2 my-2")}>
              正文 AA ≥ 4.5:1 · 大字 AA ≥ 3:1 · AAA ≥ 7:1
            </p>
            <label className="flex items-center gap-1.5 px-2 py-2 text-[10px] text-muted-foreground">
              <input
                type="checkbox"
                aria-label="只显示对比度问题"
                className="accent-primary"
                checked={issuesOnly}
                onChange={(e) => setIssuesOnly(e.currentTarget.checked)}
              />
              只显示问题
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
                  <span>{groupLabel(label)}</span>
                  <output
                    className={
                      ratio < 4.5
                        ? "text-destructive"
                        : "text-emerald-700 dark:text-emerald-400"
                    }
                  >
                    {ratio.toFixed(2)}:1 ·{" "}
                    {ratio < 4.5
                      ? "未达 AA"
                      : ratio < 7
                        ? "通过 AA"
                        : "通过 AAA"}
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
            排版和几何参数在浅色与深色之间共用，和 tweakcn
            一样。自定义字体需要安装或加载。
          </p>
          <section className="mb-2 border bg-card p-2">
            <h2 className="pb-3 font-semibold text-xs">字体</h2>
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
            <h2 className="pb-3 font-semibold text-xs">字距</h2>
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
          <Section label="HSL 调整" open>
            <p className={cn(muted, "mx-2 my-2")}>
              从一个检查点同时调整两种模式的全部颜色。
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
                  {hslPresetLabel(p.label)}
                </Button>
              ))}
              <Button
                size="xs"
                variant="outline"
                onClick={() => adjust({ hue: 0, saturation: 1, lightness: 1 })}
              >
                重置 HSL
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
            <h2 className="pb-3 font-semibold text-xs">圆角与间距</h2>
            {(["radius", "spacing"] as const).map((token) => (
              <NumericControl
                key={token}
                token={token}
                value={styles[token]}
                onChange={(v) => updateToken(token, v)}
              />
            ))}
          </section>
          <Section label="阴影" open>
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

const sameOverrides = (a: Overrides, b: Overrides) =>
  (["light", "dark"] as const).every(
    (mode) =>
      Object.keys(a[mode]).length === Object.keys(b[mode]).length &&
      Object.entries(a[mode]).every(
        ([token, value]) => b[mode][token as keyof Overrides["light"]] === value
      )
  )

export function ImportExport() {
  const { site, detected } = usePanel()
  const theme = useTheme() ?? defaults
  const [dialog, setDialog] = useState<"import" | "export" | "mcp" | null>(null)
  // CLI 安装的是已发布的预设，所以只在没有改动时提供。
  const themeId = site?.current.themeId ?? ""
  const presetId =
    dialog === "export" &&
    (themeId === "default" || Object.hasOwn(presets, themeId)) &&
    sameOverrides(site!.current.overrides, presetOverrides(themeId))
      ? themeId
      : ""
  return (
    <>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="用于 AI 编辑器"
        title="用于 AI 编辑器（MCP）"
        onClick={() => setDialog("mcp")}
      >
        <Plug />
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!detected}
        onClick={() => setDialog("import")}
      >
        导入
      </Button>
      <Button
        size="sm"
        disabled={!detected}
        onClick={() => setDialog("export")}
      >
        导出
      </Button>
      <ImportDialog
        open={dialog === "import"}
        onOpenChange={(open) => setDialog(open ? "import" : null)}
      />
      <ExportDialog
        open={dialog === "export"}
        onOpenChange={(open) => setDialog(open ? "export" : null)}
        theme={theme}
        presetId={presetId}
      />
      <McpDialog
        open={dialog === "mcp"}
        onOpenChange={(open) => setDialog(open ? "mcp" : null)}
      />
    </>
  )
}

/** 编辑控件排成一列（扩展的侧边栏）。 */
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
          {detected ? status : (site?.origin ?? "未选择网站")}
          {!detected && site ? ` · ${status}` : ""}
        </div>
        <ImportExport />
      </footer>
    </div>
  )
}
