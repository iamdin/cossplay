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

export const title = (key: string) =>
  key.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())

/** Collapsible group, labelled by a small chip like tweakcn's. */
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

/** A text field that follows `value` except while focused, and reports only valid drafts. */
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

/** Tailwind v4's palette, one row per color. */
function TailwindPalette({
  value,
  onPick,
}: {
  value: string
  onPick: (value: string) => void
}) {
  const current = formatColor(value, "hex")
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
        {swatch("black", "#000000")}
        {swatch("white", "#ffffff")}
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
          { name: "Lightness", value: oklch.l, max: 1, step: 0.001 },
          { name: "Chroma", value: oklch.c, max: 0.4, step: 0.001 },
          { name: "Hue", value: oklch.h ?? 0, max: 360, step: 1 },
        ]
      : format === "rgb"
        ? [
            { name: "Red", value: parsed.r * 255, max: 255, step: 1 },
            { name: "Green", value: parsed.g * 255, max: 255, step: 1 },
            { name: "Blue", value: parsed.b * 255, max: 255, step: 1 },
          ]
        : [
            { name: "Hue", value: hsl.h ?? 0, max: 360, step: 1 },
            { name: "Saturation", value: hsl.s, max: 1, step: 0.001 },
            { name: "Lightness", value: hsl.l, max: 1, step: 0.001 },
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
          aria-label={`${name} picker`}
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
          aria-label={`${name} value`}
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
                aria-label={`${name} Tailwind colors`}
                title="Tailwind colors"
              />
            }
          >
            <Palette />
          </PopoverTrigger>
          <PopoverPopup align="end" className="ui-chrome">
            <TailwindPalette value={value} onPick={onChange} />
          </PopoverPopup>
        </Popover>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`${name} channels`}
          aria-expanded={expanded}
          title="Channels & opacity"
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
          <span className="w-16">Opacity</span>
          <input
            type="range"
            aria-label={`${name} opacity`}
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
            aria-label={`${name} copy color`}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shown)
                setCopyStatus("Copied")
              } catch {
                setCopyStatus("Copy failed — focus Chrome and retry")
              }
            }}
          >
            Copy color
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
  // Imported px/em units stay in the text field; the slider uses its labelled unit.
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
          aria-label={`${name} slider`}
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
          aria-label={`${name} value`}
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
  // A newly typed Google font loads on blur; the token itself already changed while typing.
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
          items={categories.map((c) => ({ value: c, label: title(c) }))}
          value={category}
          onValueChange={(value) => value && setCategory(value)}
        >
          <SelectTrigger
            size="sm"
            aria-label={`${name} font category`}
            className="w-32 min-w-0 text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectPopup className="ui-chrome">
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {title(c)}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>
      <Input
        className="text-sm"
        id={`value-${token}`}
        data-token={token}
        aria-label={`${name} value`}
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
        The quick brown fox · 0123456789
      </div>
      <Button
        size="xs"
        variant="outline"
        disabled={!known || loading}
        onClick={load}
      >
        {loading ? "Loading font…" : "Load Google font"}
      </Button>
    </div>
  )
}
