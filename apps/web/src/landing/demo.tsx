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

/** One fading row of preset chips. Clicking one rethemes the page. */
export function ThemeChips({
  id,
  onSelect,
}: {
  id: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="mt-12">
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto px-4 py-1 [mask-image:linear-gradient(to_right,transparent,#000_4rem,#000_calc(100%-4rem),transparent)] [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
        {shown.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={preset === id}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-foreground text-sm shadow-xs",
              preset === id && "border-primary bg-primary/8"
            )}
            onClick={(event) => {
              onSelect(preset)
              event.currentTarget.scrollIntoView({
                block: "nearest",
                inline: "center",
              })
            }}
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
        ))}
      </div>
    </div>
  )
}
