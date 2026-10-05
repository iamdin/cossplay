import type React from "react"

import { adjustColorByHsl } from "@coss-tweak/theme-core"

import { Button } from "@coss-tweak/ui/components/button"
import { cn } from "@coss-tweak/ui/lib/utils"

interface HslPresetButtonProps {
  label: string
  hueShift: number
  saturationScale: number
  lightnessScale: number
  baseBg: string
  basePrimary: string
  baseSecondary?: string
  onClick: () => void
  selected: boolean
}

/**
 * 小型 HSL 预设按钮:用一个 resolved swatch (bg + primary/secondary 双色条) 预览
 * 该预设应用到当前 checkpoint 颜色后的效果。窄面板下无 Tooltip 原语,改用原生
 * `title` 提示 label。Ported from tweakcn `components/editor/hsl-preset-button.tsx`。
 */
export const HslPresetButton: React.FC<HslPresetButtonProps> = ({
  label,
  hueShift,
  saturationScale,
  lightnessScale,
  baseBg,
  basePrimary,
  baseSecondary = "#888888",
  onClick,
  selected,
}) => {
  const previewBg = adjustColorByHsl(baseBg, hueShift, saturationScale, lightnessScale)
  const previewPrimary = adjustColorByHsl(basePrimary, hueShift, saturationScale, lightnessScale)
  const previewSecondary = adjustColorByHsl(
    baseSecondary,
    hueShift,
    saturationScale,
    lightnessScale
  )

  return (
    <Button
      type="button"
      onClick={onClick}
      size="sm"
      variant="outline"
      title={label}
      className={cn(
        "relative h-7 w-full overflow-hidden p-0 transition-all",
        selected ? "ring-primary ring-1 ring-offset-1" : "border-border border"
      )}
      style={{ background: previewBg }}
    >
      <div className="absolute inset-0 flex">
        <div className="h-full w-1/2" style={{ background: previewPrimary }} />
        <div className="h-full w-1/2" style={{ background: previewSecondary }} />
      </div>
      {selected && (
        <div className="bg-primary absolute right-0.5 bottom-0.5 size-1.5 rounded-full" />
      )}
    </Button>
  )
}
