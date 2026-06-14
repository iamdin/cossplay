import React from "react"

import {
  COMMON_STYLES,
  defaultThemeStyles,
  type ThemeStyles,
  type ThemeStyleProps,
} from "theme-core"

import { ColorsTabContent } from "@/components/editor/colors-tab-content"
import ControlSection from "@/components/editor/control-section"
import { FontPicker } from "@/components/editor/font-picker"
import HslAdjustmentControls from "@/components/editor/hsl-adjustment-controls"
import ShadowControl from "@/components/editor/shadow-control"
import { SliderWithInput } from "@/components/editor/slider-with-input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { buildFontFamily, extractFontFamily } from "@/lib/fonts"
import { useEditorStore } from "@/store/editor-store"

/**
 * Tabbed control panel driven by the side-panel editor store. Ported from
 * tweakcn `components/editor/theme-control-panel.tsx`, adapted to:
 *  - read/write `ThemeStyles` through `useEditorStore` (no prop drilling);
 *  - local React tab state (tweakcn used a URL-driven hook);
 *  - tabs Colors / Typography / Shadows only — the AI and HSL tabs, the contrast
 *    checker and the import/export actions are out of M2 scope.
 *  - Radius + Spacing live in the Shadows tab alongside the shadow controls.
 */

type ControlTab = "colors" | "typography" | "shadows"

const COMMON_STYLE_SET = new Set<string>(COMMON_STYLES)

const COMMON_STYLES_FALLBACK = defaultThemeStyles.light

const ThemeControlPanel = () => {
  const { themeState, setThemeState } = useEditorStore()
  const [tab, setTab] = React.useState<ControlTab>("colors")

  const styles = themeState.styles
  const currentMode = themeState.currentMode

  const currentStyles = React.useMemo<ThemeStyleProps>(
    () => ({
      ...defaultThemeStyles[currentMode],
      ...styles?.[currentMode],
    }),
    [currentMode, styles]
  )

  const onChange = React.useCallback(
    (next: ThemeStyles) => {
      setThemeState({ ...themeState, styles: next })
    },
    [setThemeState, themeState]
  )

  const updateStyle = React.useCallback(
    <K extends keyof ThemeStyleProps>(key: K, value: ThemeStyleProps[K]) => {
      // Common (non-color) styles apply to both light and dark modes.
      if (COMMON_STYLE_SET.has(key as string)) {
        onChange({
          ...styles,
          light: { ...styles.light, [key]: value },
          dark: { ...styles.dark, [key]: value },
        })
        return
      }

      onChange({
        ...styles,
        [currentMode]: {
          ...currentStyles,
          [key]: value,
        },
      })
    },
    [onChange, styles, currentMode, currentStyles]
  )

  const updateStyles = React.useCallback(
    (updates: Partial<ThemeStyleProps>) => {
      onChange({
        ...styles,
        [currentMode]: {
          ...currentStyles,
          ...updates,
        },
      })
    },
    [onChange, styles, currentMode, currentStyles]
  )

  const radius = parseFloat(currentStyles.radius.replace("rem", ""))

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
          <TabsTrigger value="shadows">Shadows</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-2 min-h-0 flex-1 overflow-hidden">
          <ColorsTabContent
            currentStyles={currentStyles}
            updateStyle={updateStyle}
            updateStyles={updateStyles}
          />
        </TabsContent>

        <TabsContent value="typography" className="mt-2 min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full px-1">
            <ControlSection title="Font Family" expanded>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="font-sans"
                    className="text-muted-foreground w-16 shrink-0 text-[11px] font-medium"
                  >
                    Sans-Serif
                  </Label>
                  <div className="min-w-0 flex-1">
                    <FontPicker
                      value={extractFontFamily(currentStyles["font-sans"]) || undefined}
                      category="sans-serif"
                      placeholder="Sans-serif font..."
                      onSelect={(font) =>
                        updateStyle("font-sans", buildFontFamily(font.family, font.category))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="font-serif"
                    className="text-muted-foreground w-16 shrink-0 text-[11px] font-medium"
                  >
                    Serif
                  </Label>
                  <div className="min-w-0 flex-1">
                    <FontPicker
                      value={extractFontFamily(currentStyles["font-serif"]) || undefined}
                      category="serif"
                      placeholder="Serif font..."
                      onSelect={(font) =>
                        updateStyle("font-serif", buildFontFamily(font.family, font.category))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="font-mono"
                    className="text-muted-foreground w-16 shrink-0 text-[11px] font-medium"
                  >
                    Mono
                  </Label>
                  <div className="min-w-0 flex-1">
                    <FontPicker
                      value={extractFontFamily(currentStyles["font-mono"]) || undefined}
                      category="monospace"
                      placeholder="Monospace font..."
                      onSelect={(font) =>
                        updateStyle("font-mono", buildFontFamily(font.family, font.category))
                      }
                    />
                  </div>
                </div>
              </div>
            </ControlSection>

            <ControlSection title="Letter Spacing" expanded>
              <SliderWithInput
                value={parseFloat(
                  (currentStyles["letter-spacing"] ?? COMMON_STYLES_FALLBACK["letter-spacing"]).replace(
                    "em",
                    ""
                  )
                )}
                onChange={(value) => updateStyle("letter-spacing", `${value}em`)}
                min={-0.5}
                max={0.5}
                step={0.025}
                unit="em"
                label="Tracking"
              />
            </ControlSection>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="shadows" className="mt-2 min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full px-1">
            <ControlSection title="HSL 调整" expanded>
              <HslAdjustmentControls />
            </ControlSection>

            <ControlSection title="Radius" expanded>
              <SliderWithInput
                value={radius}
                onChange={(value) => updateStyle("radius", `${value}rem`)}
                min={0}
                max={5}
                step={0.025}
                unit="rem"
                label="Radius"
              />
            </ControlSection>

            <ControlSection title="Spacing">
              <SliderWithInput
                value={parseFloat(currentStyles.spacing?.replace("rem", "") || "0")}
                onChange={(value) => updateStyle("spacing", `${value}rem`)}
                min={0.15}
                max={0.35}
                step={0.01}
                unit="rem"
                label="Spacing"
              />
            </ControlSection>

            <ControlSection title="Shadow" expanded>
              <ShadowControl
                shadowColor={currentStyles["shadow-color"]}
                shadowOpacity={parseFloat(currentStyles["shadow-opacity"])}
                shadowBlur={parseFloat(currentStyles["shadow-blur"]?.replace("px", ""))}
                shadowSpread={parseFloat(currentStyles["shadow-spread"]?.replace("px", ""))}
                shadowOffsetX={parseFloat(currentStyles["shadow-offset-x"]?.replace("px", ""))}
                shadowOffsetY={parseFloat(currentStyles["shadow-offset-y"]?.replace("px", ""))}
                onChange={(key, value) => {
                  if (key === "shadow-color") {
                    updateStyle(key, value as string)
                  } else if (key === "shadow-opacity") {
                    updateStyle(key, value.toString())
                  } else {
                    updateStyle(key as keyof ThemeStyleProps, `${value}px`)
                  }
                }}
              />
            </ControlSection>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ThemeControlPanel
