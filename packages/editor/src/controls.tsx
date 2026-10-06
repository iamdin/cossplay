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
import { cn } from "@cossplay/ui/lib/utils"
import { converter } from "culori"
import { type ReactNode, useEffect, useRef, useState } from "react"
import fonts from "./fonts.json"
import { familyOf } from "./store"

export const title = (key: string) =>
  key.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())

export const selectClass =
  "h-8 min-w-0 border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"

/** Collapsible card section. */
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
    <details
      className="group mb-2 overflow-hidden border bg-card text-card-foreground"
      open={open}
    >
      <summary className="flex cursor-pointer select-none items-center gap-1.5 px-2 py-2 font-medium text-xs group-open:border-b [&::-webkit-details-marker]:hidden">
        <span className="w-2 text-muted-foreground transition-transform group-open:rotate-90">
          ›
        </span>
        {label}
        {count !== undefined && (
          <span className="ml-auto font-normal text-[10px] text-muted-foreground">
            {count}
          </span>
        )}
      </summary>
      {children}
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
    <div className="border-b px-2 py-2 last:border-b-0" data-control={token}>
      <div className="flex items-center gap-2">
        <label
          htmlFor={`value-${token}`}
          className="min-w-20 flex-1 text-[11px] text-muted-foreground"
        >
          {name}
        </label>
        <input
          type="color"
          aria-label={`${name} picker`}
          className="size-7 shrink-0 cursor-pointer border bg-background p-0.5"
          value={formatColor(value, "hex").slice(0, 7)}
          onChange={(e) => {
            const c = converter("rgb")(e.currentTarget.value)!
            onChange(
              `rgb(${Math.round(c.r * 255)} ${Math.round(c.g * 255)} ${Math.round(c.b * 255)} / ${alpha})`
            )
          }}
        />
        <Input
          id={`value-${token}`}
          data-token={token}
          aria-label={`${name} value`}
          aria-invalid={!validValue(token, draft)}
          className="h-7 w-32 shrink-0 bg-muted/40 px-1.5 font-mono text-[10px]"
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
      </div>
      <details className="pt-1 text-[10px] text-muted-foreground">
        <summary
          className="cursor-pointer text-[9px]"
          aria-label={`${name} channels`}
        >
          Channels & opacity
        </summary>
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
      </details>
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
          className="h-7 w-20 px-1.5 text-right font-mono text-[11px]"
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
        <select
          aria-label={`${name} font category`}
          className={cn(selectClass, "h-7 text-[11px]")}
          value={category}
          onChange={(e) => setCategory(e.currentTarget.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {title(c)}
            </option>
          ))}
        </select>
      </div>
      <Input
        id={`value-${token}`}
        data-token={token}
        aria-label={`${name} value`}
        aria-invalid={!validValue(token, draft)}
        list={`fonts-${token}`}
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
