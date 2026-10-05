import { useState } from "react"
import { ChevronDown, RotateCcw } from "lucide-react"

import { defaultHslAdjustments, HSL_PRESETS, toHex, type HslAdjustments } from "@coss-tweak/theme-core"

import { HslPresetButton } from "@/components/editor/hsl-preset-button"
import { SliderWithInput } from "@/components/editor/slider-with-input"
import { Button } from "@coss-tweak/ui/components/button"
import { cn } from "@coss-tweak/ui/lib/utils"
import { adjust, useSiteStore, useTheme } from "@/store/site-store"

/**
 * 全局 HSL 调整控件。三个 SliderWithInput(Hue/Saturation/Lightness)绑定站点状态里的
 * `current.hsl`,外加 15 个预设按钮。
 *
 * 非破坏式模型:第一次调整时把当前有效主题固定为 `hslBase`,之后每次调整都从它重算,
 * 不会叠加;手动编辑任一 token 会清掉 `hslBase`,下次调整以编辑后的主题为基准。
 * 滑动中的连续调整合并为一个撤销步骤。
 */
const HslAdjustmentControls = () => {
  const theme = useTheme()
  const site = useSiteStore((s) => s.site)
  const mode = useSiteStore((s) => s.mode)

  const [isExpanded, setIsExpanded] = useState(false)

  if (!theme || !site) return null
  const hsl = site.current.hsl
  const currentAdjustments: HslAdjustments = {
    hueShift: hsl.hue,
    saturationScale: hsl.saturation,
    lightnessScale: hsl.lightness,
  }

  const apply = (adj: HslAdjustments, continuous = false) =>
    adjust(
      { hue: adj.hueShift, saturation: adj.saturationScale, lightness: adj.lightnessScale },
      continuous
    )
  const handleChange = (property: keyof HslAdjustments, value: number) =>
    apply({ ...currentAdjustments, [property]: value }, true)
  const handlePreset = (adj: HslAdjustments) => apply(adj)
  const handleReset = () => apply({ ...defaultHslAdjustments })

  // 预设 swatch 的基准色(调整基准当前模式下的 background/primary/secondary)。
  const swatchBase = (site.current.hslBase ?? theme)[mode]
  const baseBg = toHex(swatchBase.background)
  const basePrimary = toHex(swatchBase.primary)
  const baseSecondary = toHex(swatchBase.secondary)

  const isDirty =
    currentAdjustments.hueShift !== defaultHslAdjustments.hueShift ||
    currentAdjustments.saturationScale !== defaultHslAdjustments.saturationScale ||
    currentAdjustments.lightnessScale !== defaultHslAdjustments.lightnessScale

  return (
    <div className="@container">
      <div
        className={cn(
          "-m-1 mb-2 grid grid-cols-5 gap-1.5 overflow-hidden p-1 transition-all duration-300",
          !isExpanded ? "h-9" : "h-auto"
        )}
      >
        {HSL_PRESETS.map((preset) => (
          <HslPresetButton
            key={preset.name}
            label={preset.name}
            hueShift={preset.hueShift}
            saturationScale={preset.saturationScale}
            lightnessScale={preset.lightnessScale}
            baseBg={baseBg}
            basePrimary={basePrimary}
            baseSecondary={baseSecondary}
            selected={
              currentAdjustments.hueShift === preset.hueShift &&
              currentAdjustments.saturationScale === preset.saturationScale &&
              currentAdjustments.lightnessScale === preset.lightnessScale
            }
            onClick={() =>
              handlePreset({
                hueShift: preset.hueShift,
                saturationScale: preset.saturationScale,
                lightnessScale: preset.lightnessScale,
              })
            }
          />
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground flex-1 justify-center text-xs"
          onClick={() => setIsExpanded((v) => !v)}
        >
          {isExpanded ? "收起" : "展开"}预设
          <ChevronDown
            className={cn("ml-1 transition-transform duration-200", isExpanded && "rotate-180")}
          />
        </Button>
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground text-xs"
          disabled={!isDirty}
          onClick={handleReset}
          title="重置 HSL"
        >
          <RotateCcw />
          重置 HSL
        </Button>
      </div>

      <SliderWithInput
        value={currentAdjustments.hueShift}
        onChange={(value) => handleChange("hueShift", value)}
        unit="°"
        min={-180}
        max={180}
        step={1}
        label="Hue"
      />
      <SliderWithInput
        value={currentAdjustments.saturationScale}
        onChange={(value) => handleChange("saturationScale", value)}
        unit="x"
        min={0}
        max={2}
        step={0.01}
        label="Saturation"
      />
      <SliderWithInput
        value={currentAdjustments.lightnessScale}
        onChange={(value) => handleChange("lightnessScale", value)}
        unit="x"
        min={0.2}
        max={2}
        step={0.01}
        label="Lightness"
      />
    </div>
  )
}

export default HslAdjustmentControls
