import {
  defaults,
  effective,
  presetOverrides,
  presets,
  variables,
} from "@cossplay/core/coss"
import { cn } from "@cossplay/ui/lib/utils"
import { type CSSProperties, useEffect, useMemo, useState } from "react"

// Brand-named presets stay off the marketing page.
const brands = new Set(["t3-chat", "twitter", "supabase", "vercel", "claude"])
const featured = ["default", "modern-minimal", "mono"]
const shown = [
  ...featured,
  ...Object.keys(presets).filter(
    (id) => !brands.has(id) && !featured.includes(id)
  ),
]

export const presetLabel = (id: string) =>
  id === "default" ? "coss ui" : (presets[id]?.label ?? id)

const loadedFonts = new Set<string>()

/** Loads a preset's Google font. Geist is already on the page. */
function loadFont(stack: string | undefined) {
  const family = stack?.split(",")[0].replaceAll(/['"]/g, "").trim()
  if (!family || /^(Geist|ui-|system-ui|Courier New|Georgia)/.test(family))
    return
  if (loadedFonts.has(family)) return
  loadedFonts.add(family)
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`
  document.head.append(link)
}

/** The page ships Geist Variable; preset stacks say "Geist". */
function hosted(stack: string) {
  const named = stack
    .replaceAll("Geist Mono Variable", "\u0000")
    .replaceAll("Geist Variable", "\u0001")
    .replaceAll("Geist Mono", "\u0000")
    .replaceAll("Geist", "\u0001")
    .replaceAll("\u0000", "Geist Mono Variable")
    .replaceAll("\u0001", "Geist Variable")
  // coss's own sans token is the generic Tailwind stack. The site draws that as Geist.
  if (named.replaceAll('"', "").startsWith("ui-sans-serif"))
    return '"Geist Variable", ui-sans-serif, system-ui, sans-serif'
  return named
}

const dotTokens = ["primary", "secondary", "accent"] as const

function swatches(id: string) {
  const light = effective(defaults, presetOverrides(id)).light
  return dotTokens.map((token) => ({ token, color: light[token] }))
}

/** Preset variables for the whole landing, not a nested preview. */
export function useLandingTheme(initial = "default") {
  const [id, setId] = useState(initial)
  const style = useMemo(() => {
    const overrides = presetOverrides(id)
    const theme = effective(defaults, overrides)
    const vars = variables(theme.light, overrides.light)
    for (const key of ["font-sans", "font-serif", "font-mono"] as const) {
      if (vars[key]) vars[key] = hosted(vars[key])
    }
    return Object.fromEntries(
      Object.entries(vars).map(([key, value]) => [`--${key}`, value])
    ) as CSSProperties
  }, [id])
  useEffect(() => {
    const light = presetOverrides(id).light
    loadFont(light["font-sans"])
    loadFont(light["font-serif"])
  }, [id])
  return { id, setId, style }
}

function Chip({
  preset,
  selected,
  onSelect,
  tabIndex,
}: {
  preset: string
  selected: boolean
  onSelect: (id: string) => void
  tabIndex?: number
}) {
  return (
    <button
      type="button"
      tabIndex={tabIndex}
      aria-pressed={selected}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm text-foreground shadow-xs",
        selected && "border-primary bg-primary/8"
      )}
      onClick={() => onSelect(preset)}
    >
      <span className="flex items-center gap-1" aria-hidden>
        {swatches(preset).map((dot) => (
          <span
            key={dot.token}
            className="size-2.5 rounded-full ring-1 ring-foreground/15"
            style={{ backgroundColor: dot.color }}
          />
        ))}
      </span>
      {presetLabel(preset)}
    </button>
  )
}

const marqueeRows = 3
const rows = Array.from({ length: marqueeRows }, (_, row) =>
  shown.filter((_, index) => index % marqueeRows === row)
)

function MarqueeRow({
  presets,
  reverse,
  selected,
  onSelect,
}: {
  presets: string[]
  reverse: boolean
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="relative h-10 w-full min-w-0 overflow-hidden">
      <div
        className={cn(
          "absolute inset-y-0 left-0 flex w-max items-center focus-within:[animation-play-state:paused] hover:[animation-play-state:paused]",
          reverse
            ? "motion-safe:animate-marquee-reverse"
            : "motion-safe:animate-marquee"
        )}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex"
            aria-hidden={copy === 1 ? true : undefined}
          >
            {presets.map((preset) => (
              <div key={preset} className="pr-2">
                <Chip
                  preset={preset}
                  selected={preset === selected}
                  onSelect={onSelect}
                  tabIndex={copy === 1 ? -1 : undefined}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Three fading rows that scroll in alternate directions. Clicking a chip rethemes the page. */
export function ThemeChips({
  id,
  onSelect,
}: {
  id: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="mt-12 flex w-full max-w-full min-w-0 flex-col gap-2 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_4rem,#000_calc(100%-4rem),transparent)] py-1">
      {rows.map((presets, row) => (
        <MarqueeRow
          key={presets[0]}
          presets={presets}
          reverse={row % 2 === 1}
          selected={id}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
