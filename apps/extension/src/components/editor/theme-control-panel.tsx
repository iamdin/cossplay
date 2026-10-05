import React from "react"

import type { Token } from "@coss-tweak/theme-core/coss"

import { ColorsTabContent } from "@/components/editor/colors-tab-content"
import ControlSection from "@/components/editor/control-section"
import { FontPicker } from "@/components/editor/font-picker"
import HslAdjustmentControls from "@/components/editor/hsl-adjustment-controls"
import { SliderWithInput } from "@/components/editor/slider-with-input"
import { Label } from "@coss-tweak/ui/components/label"
import { ScrollArea } from "@coss-tweak/ui/components/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@coss-tweak/ui/components/tabs"
import { buildFontFamily, extractFontFamily, type FontCategory } from "@/lib/fonts"
import { loadFont, updateToken, useSiteStore, useTheme } from "@/store/site-store"

/**
 * Tabbed control panel over coss ui's theme variables. Ported from tweakcn
 * `components/editor/theme-control-panel.tsx`; edits go through the site store, which
 * applies shared tokens (radius, fonts) to both modes.
 */

type ControlTab = "colors" | "typography" | "other"

const FONT_SLOTS: { token: Token; label: string; category: FontCategory }[] = [
  { token: "font-sans", label: "Sans", category: "sans-serif" },
  { token: "font-heading", label: "Heading", category: "sans-serif" },
  { token: "font-mono", label: "Mono", category: "monospace" },
]

const ThemeControlPanel = () => {
  const theme = useTheme()
  const mode = useSiteStore((s) => s.mode)
  const [tab, setTab] = React.useState<ControlTab>("colors")

  if (!theme) return null
  const currentStyles = theme[mode]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as ControlTab)}
        className="flex min-h-0 w-full flex-1 flex-col"
      >
        <TabsList className="bg-muted/60 mx-1 grid w-auto grid-cols-3">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-2 min-h-0 flex-1 overflow-hidden">
          <ColorsTabContent currentStyles={currentStyles} updateStyle={updateToken} />
        </TabsContent>

        <TabsContent value="typography" className="mt-2 min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full px-1">
            <ControlSection title="Font Family" expanded>
              <div className="space-y-1.5">
                {FONT_SLOTS.map((slot) => (
                  <div key={slot.token} className="flex items-center gap-2">
                    <Label
                      htmlFor={slot.token}
                      className="text-muted-foreground w-16 shrink-0 text-[11px] font-medium"
                    >
                      {slot.label}
                    </Label>
                    <div className="min-w-0 flex-1">
                      <FontPicker
                        value={extractFontFamily(currentStyles[slot.token]) || undefined}
                        category={slot.category}
                        placeholder={`${slot.label} font...`}
                        onSelect={(font) => {
                          updateToken(slot.token, buildFontFamily(font.family, font.category))
                          loadFont(font.family, font.variants)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ControlSection>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="other" className="mt-2 min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full px-1">
            <ControlSection title="HSL 调整" expanded>
              <HslAdjustmentControls />
            </ControlSection>

            <ControlSection title="Radius" expanded>
              <SliderWithInput
                value={parseFloat(currentStyles.radius)}
                onChange={(value) => updateToken("radius", `${value}rem`)}
                min={0}
                max={5}
                step={0.025}
                unit="rem"
                label="Radius"
              />
            </ControlSection>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ThemeControlPanel
