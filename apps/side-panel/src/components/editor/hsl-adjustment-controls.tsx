import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronDown, RotateCcw } from "lucide-react"

import {
  applyHslAdjustmentsToStyles,
  defaultHslAdjustments,
  HSL_PRESETS,
  toHex,
  type HslAdjustments,
} from "theme-core"

import { HslPresetButton } from "@/components/editor/hsl-preset-button"
import { SliderWithInput } from "@/components/editor/slider-with-input"
import { Button } from "@/components/ui/button"
import { cn, debounce } from "@/lib/utils"
import { useEditorStore } from "@/store/editor-store"

/**
 * 全局 HSL 调整控件。三个 SliderWithInput(Hue/Saturation/Lightness)绑定
 * `themeState.hslAdjustments`,外加 15 个预设按钮。
 *
 * 非破坏式模型(对齐 tweakcn):以 `themeCheckpoint` 的 styles 为 base,每次调整
 * 都 `applyHslAdjustmentsToStyles(base, adj)` 重算,再 `setThemeState` 写回新的
 * styles 引用 —— bridge 订阅 `themeState.styles` 引用变化即可 live 推送到页面。
 * apply 走 ~10ms debounce 避免滑动时抖动。
 */
const HslAdjustmentControls = () => {
  const themeState = useEditorStore((s) => s.themeState)
  const themeCheckpoint = useEditorStore((s) => s.themeCheckpoint)
  const setThemeState = useEditorStore((s) => s.setThemeState)

  const [isExpanded, setIsExpanded] = useState(false)

  const currentAdjustments = themeState.hslAdjustments ?? defaultHslAdjustments

  // 在 debounce 回调里读最新 store 状态(idiomatic Zustand),避免 stale closure /
  // 重建 debounce。base = checkpoint styles(非破坏式基准),回退到当前 styles。
  const debouncedApply = useMemo(
    () =>
      debounce((adj: HslAdjustments) => {
        const { themeState: latest, themeCheckpoint: checkpoint } = useEditorStore.getState()
        const base = (checkpoint ?? latest).styles
        const nextStyles = applyHslAdjustmentsToStyles(base, adj)
        setThemeState({
          ...latest,
          styles: nextStyles,
          hslAdjustments: adj,
        })
      }, 10),
    [setThemeState]
  )

  useEffect(() => () => debouncedApply.cancel(), [debouncedApply])

  const handleChange = useCallback(
    (property: keyof HslAdjustments, value: number) => {
      debouncedApply({ ...currentAdjustments, [property]: value })
    },
    [currentAdjustments, debouncedApply]
  )

  const handlePreset = useCallback(
    (adj: HslAdjustments) => {
      debouncedApply(adj)
    },
    [debouncedApply]
  )

  const handleReset = useCallback(() => {
    debouncedApply({ ...defaultHslAdjustments })
  }, [debouncedApply])

  // 预设 swatch 的基准色(用 checkpoint 当前模式下的 background/primary/secondary)。
  const swatchBase = (themeCheckpoint ?? themeState).styles[themeState.currentMode]
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
