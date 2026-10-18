import {
  defaults,
  effective,
  presetOverrides,
  presets,
  variables,
} from "@cossplay/core/coss"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@cossplay/ui/components/alert"
import { Avatar, AvatarFallback } from "@cossplay/ui/components/avatar"
import { Badge } from "@cossplay/ui/components/badge"
import { Button } from "@cossplay/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@cossplay/ui/components/card"
import { Field, FieldLabel } from "@cossplay/ui/components/field"
import { Input } from "@cossplay/ui/components/input"
import { Label } from "@cossplay/ui/components/label"
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@cossplay/ui/components/progress"
import { Switch } from "@cossplay/ui/components/switch"
import { cn } from "@cossplay/ui/lib/utils"
import { CheckIcon, InfoIcon, MoonIcon, SunIcon } from "lucide-react"
import { type CSSProperties, useEffect, useMemo, useState } from "react"

// Brand-named presets stay out of the marketing page.
const shown = [
  "default",
  "modern-minimal",
  "doom-64",
  "catppuccin",
  "kodama-grove",
  "neo-brutalism",
  "vintage-paper",
  "cosmic-night",
  "bubblegum",
  "ocean-breeze",
]
const label = (id: string) =>
  id === "default" ? "coss ui" : (presets[id]?.label ?? id)

const loadedFonts = new Set<string>()
/** Loads a preset's Google font for the demo; system and Geist stacks need nothing. */
function loadFont(stack: string | undefined) {
  const family = stack?.split(",")[0].replaceAll(/['"]/g, "").trim()
  if (!family || /^(Geist|ui-|system-ui|Courier New)/.test(family)) return
  if (loadedFonts.has(family)) return
  loadedFonts.add(family)
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`
  document.head.append(link)
}

/** coss ui components re-themed in place by a preset, as the editor and extension do. */
export function ThemeDemo() {
  const [id, setId] = useState("modern-minimal")
  const [dark, setDark] = useState(false)
  const mode = dark ? "dark" : "light"
  const style = useMemo(() => {
    const overrides = presetOverrides(id)
    const theme = effective(defaults, overrides)
    const vars = variables(theme[mode], overrides[mode])
    return Object.fromEntries(
      Object.entries(vars).map(([key, value]) => [`--${key}`, value])
    ) as CSSProperties
  }, [id, mode])
  useEffect(() => loadFont(presetOverrides(id).light["font-sans"]), [id])

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xl/5">
      <div className="flex flex-wrap items-center gap-1.5 border-b bg-muted/50 p-2">
        {shown.map((preset) => (
          <Button
            key={preset}
            size="xs"
            variant={preset === id ? "default" : "ghost"}
            aria-pressed={preset === id}
            onClick={() => setId(preset)}
          >
            {label(preset)}
          </Button>
        ))}
        <Button
          size="icon-xs"
          variant="outline"
          className="ml-auto"
          aria-label={dark ? "Light mode" : "Dark mode"}
          onClick={() => setDark(!dark)}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>
      <div className={cn(dark && "dark")}>
        <div
          style={{ ...style, fontFamily: "var(--font-sans)" }}
          className="grid gap-4 bg-background p-4 text-foreground transition-colors sm:grid-cols-2 sm:p-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Create an account</CardTitle>
              <CardDescription>Start your 14-day trial.</CardDescription>
            </CardHeader>
            <CardPanel className="flex flex-col gap-3">
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  aria-label="Demo email"
                />
              </Field>
              <Label className="font-normal">
                <Switch defaultChecked />
                Send me product updates
              </Label>
              <div className="flex gap-2">
                <Button className="flex-1">Sign up</Button>
                <Button variant="outline">Log in</Button>
              </div>
            </CardPanel>
          </Card>
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardDescription>Monthly revenue</CardDescription>
                <CardTitle className="text-2xl">$48,210</CardTitle>
              </CardHeader>
              <CardPanel className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="success">+12.4%</Badge>
                  <Badge variant="info">Q3</Badge>
                  <Badge variant="warning">2 pending</Badge>
                  <Badge variant="secondary">USD</Badge>
                </div>
                <Progress value={68} aria-label="Demo goal">
                  <ProgressTrack>
                    <ProgressIndicator />
                  </ProgressTrack>
                </Progress>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Avatar className="size-6">
                    <AvatarFallback className="text-xs">AK</AvatarFallback>
                  </Avatar>
                  68% of the quarter's goal
                </div>
              </CardPanel>
            </Card>
            <Alert variant="info">
              <InfoIcon />
              <AlertTitle>Deploy finished</AlertTitle>
              <AlertDescription>
                <span className="flex items-center gap-1">
                  <CheckIcon className="size-3.5" /> All checks passed.
                </span>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  )
}
