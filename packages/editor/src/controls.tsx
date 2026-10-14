import {
  type ColorFormat,
  formatColor,
  numericControls,
  parseColor,
  type Token,
  validValue,
} from "@cossplay/core/coss"
import { Button } from "@cossplay/ui/components/button"
import { Input } from "@cossplay/ui/components/input"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@cossplay/ui/components/popover"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@cossplay/ui/components/select"
import { converter } from "culori"
import { ChevronRight, Palette, SlidersHorizontal } from "lucide-react"
import { type ReactNode, useEffect, useRef, useState } from "react"
import fonts from "./fonts.json"
import { familyOf } from "./store"
import tailwindColors from "./tailwind-colors.json"

const tokenLabels: Record<string, string> = {
  primary: "主色",
  "primary-foreground": "主色前景",
  secondary: "次色",
  "secondary-foreground": "次色前景",
  accent: "强调",
  "accent-foreground": "强调前景",
  background: "背景",
  foreground: "前景",
  card: "卡片",
  "card-foreground": "卡片前景",
  popover: "弹出层",
  "popover-foreground": "弹出层前景",
  muted: "柔和",
  "muted-foreground": "柔和前景",
  destructive: "危险",
  "destructive-foreground": "危险前景",
  info: "信息",
  "info-foreground": "信息前景",
  success: "成功",
  "success-foreground": "成功前景",
  warning: "警告",
  "warning-foreground": "警告前景",
  border: "边框",
  input: "输入",
  ring: "焦点环",
  "chart-1": "图表 1",
  "chart-2": "图表 2",
  "chart-3": "图表 3",
  "chart-4": "图表 4",
  "chart-5": "图表 5",
  sidebar: "侧栏",
  "sidebar-foreground": "侧栏前景",
  "sidebar-primary": "侧栏主色",
  "sidebar-primary-foreground": "侧栏主色前景",
  "sidebar-accent": "侧栏强调",
  "sidebar-accent-foreground": "侧栏强调前景",
  "sidebar-border": "侧栏边框",
  "sidebar-ring": "侧栏焦点环",
  code: "代码",
  "code-foreground": "代码前景",
  "code-highlight": "代码高亮",
  "shadow-color": "阴影颜色",
  "font-sans": "无衬线字体",
  "font-serif": "衬线字体",
  "font-mono": "等宽字体",
  radius: "圆角",
  spacing: "间距",
  "letter-spacing": "字距",
  "shadow-opacity": "阴影不透明度",
  "shadow-blur": "阴影模糊",
  "shadow-spread": "阴影扩展",
  "shadow-offset-x": "阴影水平偏移",
  "shadow-offset-y": "阴影垂直偏移",
}
/** 控件上给人看的名字。token 标识本身不变。 */
export const title = (key: string) => tokenLabels[key] ?? key

const groupLabels: Record<string, string> = {
  Primary: "主色",
  Secondary: "次色",
  Accent: "强调",
  Base: "基础",
  Card: "卡片",
  Popover: "弹出层",
  Muted: "柔和",
  Destructive: "危险",
  Info: "信息",
  Success: "成功",
  Warning: "警告",
  "Border & Input": "边框与输入",
  Charts: "图表",
  Sidebar: "侧栏",
  Code: "代码",
  "Sidebar Primary": "侧栏主色",
  "Sidebar Accent": "侧栏强调",
}
/** 分组与对比度条目的显示名；键仍是 token 分组名。 */
export const groupLabel = (group: string) => groupLabels[group] ?? group

/** 可折叠分组，小标签样式同 tweakcn。 */
export function Section({
  label,
  count,
  open,
  children,
}: {
  label: string
  count?: ReactNode
  open?: boolean
  children: ReactNode
}) {
  return (
    <details className="group mb-1.5" open={open}>
      <summary className="inline-flex cursor-pointer select-none items-center gap-1 rounded-md border px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wide hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3 transition-transform group-open:rotate-90" />
        {label}
        {count !== undefined && (
          <span className="font-normal normal-case opacity-70">{count}</span>
        )}
      </summary>
      <div className="pt-1.5">{children}</div>
    </details>
  )
}

/** 聚焦时保留草稿，失焦后跟回 `value`，只上报合法值。 */
function useDraft(value: string) {
  const [draft, setDraft] = useState(value)
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setDraft(value)
  }, [value])
  return {
    draft,
    setDraft,
    focus: () => {
      focused.current = true
    },
    blur: () => {
      focused.current = false
    },
  }
}

/** Tailwind v4 色板，每种颜色一行。 */
function TailwindPalette({
  value,
  onPick,
}: {
  value: string
  onPick: (value: string) => void
}) {
  const current = formatColor(value, "hex").slice(0, 7)
  const swatch = (label: string, color: string) => (
    <button
      key={label}
      type="button"
      aria-label={label}
      title={label}
      data-selected={formatColor(color, "hex") === current || undefined}
      className="size-4 rounded-sm border border-black/10 outline-offset-1 hover:scale-125 data-selected:outline-2 data-selected:outline-ring"
      style={{ background: color }}
      onClick={() => onPick(color)}
    />
  )
  return (
    <div className="grid gap-1 text-[10px] text-muted-foreground">
      <div className="flex gap-1">
        {swatch("black", "rgb(0 0 0)")}
        {swatch("white", "rgb(255 255 255)")}
      </div>
      {Object.entries(tailwindColors).map(([color, shades]) => (
        <div key={color} className="flex items-center gap-1">
          <span className="w-12 truncate">{color}</span>
          {Object.entries(shades).map(([shade, v]) =>
            swatch(`${color}-${shade}`, v)
          )}
        </div>
      ))}
    </div>
  )
}

export function ColorControl({
  token,
  value,
  format,
  onChange,
}: {
  token: Token
  value: string
  format: ColorFormat
  onChange: (value: string) => void
}) {
  const shown = formatColor(value, format)
  const { draft, setDraft, focus, blur } = useDraft(shown)
  const [copyStatus, setCopyStatus] = useState("")
  const [expanded, setExpanded] = useState(false)
  const parsed = parseColor(value)!
  const hsl = converter("hsl")(parsed)!
  const oklch = converter("oklch")(parsed)!
  const alpha = parsed.alpha ?? 1
  const channels =
    format === "oklch"
      ? [
          { name: "明度", value: oklch.l, max: 1, step: 0.001 },
          { name: "彩度", value: oklch.c, max: 0.4, step: 0.001 },
          { name: "色相", value: oklch.h ?? 0, max: 360, step: 1 },
        ]
      : format === "rgb"
        ? [
            { name: "红", value: parsed.r * 255, max: 255, step: 1 },
            { name: "绿", value: parsed.g * 255, max: 255, step: 1 },
            { name: "蓝", value: parsed.b * 255, max: 255, step: 1 },
          ]
        : [
            { name: "色相", value: hsl.h ?? 0, max: 360, step: 1 },
            { name: "饱和度", value: hsl.s, max: 1, step: 0.001 },
            { name: "明度", value: hsl.l, max: 1, step: 0.001 },
          ]
  const changeChannel = (index: number, n: number) => {
    const v = channels.map((c, i) => (i === index ? n : c.value))
    onChange(
      format === "oklch"
        ? `oklch(${v.join(" ")} / ${alpha})`
        : format === "rgb"
          ? `rgb(${v.join(" ")} / ${alpha})`
          : `hsl(${v[0]} ${v[1] * 100}% ${v[2] * 100}% / ${alpha})`
    )
  }
  const name = title(token)
  return (
    <div className="py-1" data-control={token}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${name} 拾色器`}
          className="size-7 shrink-0 cursor-pointer rounded-md border bg-background p-0.5"
          value={formatColor(value, "hex").slice(0, 7)}
          onChange={(e) => {
            const c = converter("rgb")(e.currentTarget.value)!
            onChange(
              `rgb(${Math.round(c.r * 255)} ${Math.round(c.g * 255)} ${Math.round(c.b * 255)} / ${alpha})`
            )
          }}
        />
        <label
          htmlFor={`value-${token}`}
          className="min-w-0 flex-1 truncate text-[11px]"
        >
          {name}
        </label>
        <Input
          id={`value-${token}`}
          data-token={token}
          aria-label={`${name} 的值`}
          aria-invalid={!validValue(token, draft)}
          size="sm"
          className="w-36 shrink-0 font-mono text-xs sm:text-xs"
          spellCheck={false}
          value={draft}
          onFocus={focus}
          onChange={(e) => {
            const v = e.currentTarget.value
            setDraft(v)
            if (validValue(token, v)) onChange(v)
          }}
          onBlur={() => {
            blur()
            setDraft(shown)
          }}
        />
        <Popover>
          <PopoverTrigger
            render={
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`${name} Tailwind 色板`}
                title="Tailwind 色板"
              />
            }
          >
            <Palette />
          </PopoverTrigger>
          <PopoverPopup align="end" className="ui-chrome">
            <TailwindPalette
              value={value}
              onPick={(color) =>
                // 与拾色器、滑杆一样，保留该 token 的不透明度。
                onChange(
                  alpha < 1 ? color.replace(/\)$/, ` / ${alpha})`) : color
                )
              }
            />
          </PopoverPopup>
        </Popover>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`${name} 通道`}
          aria-expanded={expanded}
          title="通道与不透明度"
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal />
        </Button>
      </div>
      <div
        hidden={!expanded}
        className="mt-1 ml-9 text-[10px] text-muted-foreground"
      >
        {channels.map((c, i) => (
          <label key={c.name} className="mt-1 flex items-center gap-1.5">
            <span className="w-16">{c.name}</span>
            <input
              type="range"
              aria-label={`${name} ${c.name}`}
              className="h-5 min-w-0 flex-1 accent-primary"
              min={0}
              max={c.max}
              step={c.step}
              value={c.value}
              onChange={(e) => changeChannel(i, Number(e.currentTarget.value))}
            />
            <output className="w-9 text-right tabular-nums">
              {c.value.toFixed(3)}
            </output>
          </label>
        ))}
        <label className="mt-1 flex items-center gap-1.5">
          <span className="w-16">不透明度</span>
          <input
            type="range"
            aria-label={`${name} 不透明度`}
            className="h-5 min-w-0 flex-1 accent-primary"
            min={0}
            max={1}
            step={0.01}
            value={alpha}
            onChange={(e) =>
              onChange(
                formatColor(value, "hsl").replace(
                  /(?:\s*\/[^)]*)?\)$/,
                  ` / ${e.currentTarget.value})`
                )
              )
            }
          />
          <output className="w-9 text-right tabular-nums">
            {Math.round(alpha * 100)}%
          </output>
        </label>
        <div className="mt-1.5 flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            aria-label={`复制 ${name} 颜色`}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shown)
                setCopyStatus("已复制")
              } catch {
                setCopyStatus("复制失败，请聚焦 Chrome 后重试")
              }
            }}
          >
            复制颜色
          </Button>
          <span role="status">{copyStatus}</span>
        </div>
      </div>
    </div>
  )
}

export function NumericControl({
  token,
  value,
  onChange,
}: {
  token: Token
  value: string
  onChange: (value: string) => void
}) {
  const config = numericControls[token]!
  const { draft, setDraft, focus, blur } = useDraft(value)
  // 导入的 px/em 留在文本框；滑杆用控件自己的单位。
  const numeric = Number.isFinite(Number.parseFloat(value))
    ? Number.parseFloat(value)
    : 0
  const sliderValue =
    config.unit === "rem" && value.endsWith("px") ? numeric / 16 : numeric
  const normalize = (v: string) =>
    config.unit && /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v)
      ? `${Number(v)}${config.unit}`
      : v
  const name = title(token)
  return (
    <div className="mb-3">
      <label
        htmlFor={`value-${token}`}
        className="mb-1.5 flex justify-between text-[11px] text-muted-foreground"
      >
        {name} <small>{config.unit || "0–1"}</small>
      </label>
      <div className="flex items-center gap-2.5">
        <input
          type="range"
          aria-label={`${name} 滑杆`}
          className="h-5 min-w-0 flex-1 accent-primary"
          min={Math.min(config.min, sliderValue)}
          max={Math.max(config.max, sliderValue)}
          step={config.step}
          value={sliderValue}
          onChange={(e) => onChange(`${e.currentTarget.value}${config.unit}`)}
        />
        <Input
          id={`value-${token}`}
          data-token={token}
          aria-label={`${name} 的值`}
          aria-invalid={!validValue(token, normalize(draft))}
          size="sm"
          className="w-20 font-mono text-xs sm:text-xs [&_input]:text-right"
          value={draft}
          onFocus={focus}
          onChange={(e) => {
            const v = e.currentTarget.value
            setDraft(v)
            const next = normalize(v)
            if (validValue(token, next)) onChange(next)
          }}
          onBlur={() => {
            blur()
            setDraft(value)
          }}
        />
      </div>
    </div>
  )
}

const categories = [
  "all",
  "sans serif",
  "serif",
  "monospace",
  "display",
  "handwriting",
]
const categoryLabels: Record<string, string> = {
  all: "全部",
  "sans serif": "无衬线",
  serif: "衬线",
  monospace: "等宽",
  display: "展示",
  handwriting: "手写",
}
export function FontControl({
  token,
  value,
  onChange,
  onLoad,
}: {
  token: Token
  value: string
  onChange: (value: string) => void
  onLoad: (family: string) => Promise<void>
}) {
  const { draft, setDraft, focus, blur } = useDraft(value)
  const [category, setCategory] = useState("all")
  const [loading, setLoading] = useState(false)
  // 新输入的 Google 字体在失焦时加载；token 在输入过程中已经改过。
  const focusedValue = useRef(value)
  const family = familyOf(draft)
  const matches = fonts
    .filter(
      (f) =>
        (category === "all" || f.category === category) &&
        f.family.toLowerCase().includes(family.toLowerCase())
    )
    .slice(0, 50)
  const known = fonts.find(
    (f) => f.family.toLowerCase() === family.toLowerCase()
  )
  const load = async () => {
    if (!known) return
    setLoading(true)
    try {
      await onLoad(known.family)
    } finally {
      setLoading(false)
    }
  }
  const name = title(token)
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label
          htmlFor={`value-${token}`}
          className="text-[11px] text-muted-foreground"
        >
          {name}
        </label>
        <Select
          items={categories.map((c) => ({
            value: c,
            label: categoryLabels[c],
          }))}
          value={category}
          onValueChange={(value) => value && setCategory(value)}
        >
          <SelectTrigger
            size="sm"
            aria-label={`${name} 字体类别`}
            className="w-32 min-w-0 text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectPopup className="ui-chrome">
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {categoryLabels[c]}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>
      <Input
        className="text-sm"
        id={`value-${token}`}
        data-token={token}
        aria-label={`${name} 的值`}
        aria-invalid={!validValue(token, draft)}
        list={`fonts-${token}`}
        size="sm"
        value={draft}
        onFocus={() => {
          focus()
          focusedValue.current = value
        }}
        onChange={(e) => {
          const v = e.currentTarget.value
          setDraft(v)
          if (validValue(token, v)) onChange(v)
        }}
        onBlur={() => {
          blur()
          if (!validValue(token, draft)) setDraft(value)
          else if (known && familyOf(focusedValue.current) !== known.family)
            load()
        }}
      />
      <datalist id={`fonts-${token}`}>
        {matches.map((f) => (
          <option
            key={f.family}
            value={`"${f.family}", ${f.category === "monospace" ? "monospace" : f.category === "serif" ? "serif" : "sans-serif"}`}
          />
        ))}
      </datalist>
      <div
        className="my-2 overflow-hidden border border-dashed p-2.5 text-sm [overflow-wrap:anywhere]"
        style={{ fontFamily: value }}
      >
        永字八法 · Aa 0123456789
      </div>
      <Button
        size="xs"
        variant="outline"
        disabled={!known || loading}
        onClick={load}
      >
        {loading ? "正在加载字体…" : "加载 Google 字体"}
      </Button>
    </div>
  )
}
