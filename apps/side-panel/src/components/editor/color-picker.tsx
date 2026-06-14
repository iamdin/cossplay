import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { colorFormatter, toHex } from "theme-core"

import { cn, debounce } from "@/lib/utils"
import {
  useColorControlFocus,
  type FocusColorId,
} from "@/store/color-control-focus-store"
import { ColorSelectorPopover } from "./color-selector-popover"
import { SectionContext } from "./section-context"

/** Local 50ms debounce, matching tweakcn `DEBOUNCE_DELAY`. */
const DEBOUNCE_DELAY = 50

export type ColorPickerProps = {
  color: string
  onChange: (color: string) => void
  label: string
  name?: FocusColorId
}

/**
 * Dual color control (native swatch + text input + Tailwind palette popover).
 * Ported from tweakcn `components/editor/color-picker.tsx`, adapted to:
 *  - the side-panel color-control-focus store;
 *  - theme-core's color helpers so values round-trip through
 *    `colorFormatter(_, "oklch")` and translucent coss tokens keep their alpha.
 *
 * The native `<input type="color">` can only represent opaque 6-digit hex, so it
 * is fed `toHex(color)`; the text input and palette popover preserve full
 * (incl. alpha) color strings.
 */
const ColorPicker = ({ color, onChange, label, name }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sectionCtx = useContext(SectionContext)
  const { registerColor, unregisterColor, highlightTarget } = useColorControlFocus()

  // Normalise every change through oklch so the store + generated CSS stay
  // consistent and alpha is preserved.
  const emitChange = useCallback(
    (value: string) => {
      onChange(colorFormatter(value, "oklch"))
    },
    [onChange]
  )

  useEffect(() => {
    if (!name) return
    registerColor(name, rootRef.current)
    return () => unregisterColor(name)
  }, [name, registerColor, unregisterColor])

  useEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.value = color
    }
  }, [color])

  const debouncedOnChange = useMemo(
    () => debounce((value: string) => emitChange(value), DEBOUNCE_DELAY),
    [emitChange]
  )

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedOnChange(e.target.value)
    },
    [debouncedOnChange]
  )

  const handleTextInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedOnChange(e.target.value)
    },
    [debouncedOnChange]
  )

  useEffect(() => {
    return () => debouncedOnChange.cancel()
  }, [debouncedOnChange])

  const isHighlighted = name && highlightTarget === name

  useEffect(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current)
      animationTimerRef.current = null
    }

    if (isHighlighted) {
      // Driven by the external focus store (programmatic color focus), so this
      // synchronous setState is intentional and does not cascade on every render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldAnimate(true)
      sectionCtx?.setIsExpanded(true)

      setTimeout(
        () => {
          rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
        },
        sectionCtx?.isExpanded ? 0 : 100
      )

      animationTimerRef.current = setTimeout(() => {
        setShouldAnimate(false)
        animationTimerRef.current = null
      }, 1500)
    } else {
      setShouldAnimate(false)
    }

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current)
        animationTimerRef.current = null
      }
    }
  }, [isHighlighted, sectionCtx])

  const swatchHex = toHex(color)

  return (
    <div
      ref={rootRef}
      className={cn(
        "group hover:bg-muted/50 -mx-1 flex items-center gap-2.5 rounded-lg px-2 py-0.5 transition-all duration-200",
        shouldAnimate && "bg-muted ring-primary ring-2"
      )}
    >
      <div
        className="relative flex size-7 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border shadow-sm"
        style={{ backgroundColor: color }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="color"
          id={`color-${label.replace(/\s+/g, "-").toLowerCase()}`}
          value={swatchHex}
          onChange={handleColorChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      <span className="text-foreground min-w-0 shrink-0 text-[13px] font-medium">{label}</span>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
        <input
          ref={textInputRef}
          type="text"
          defaultValue={color}
          onChange={handleTextInputChange}
          className="bg-muted/50 text-muted-foreground focus:text-foreground focus:border-ring h-7 w-full min-w-0 rounded border px-2 text-xs font-mono transition-colors outline-none"
          placeholder="hex or tailwind"
        />
        <ColorSelectorPopover currentColor={color} onChange={emitChange} />
      </div>
    </div>
  )
}

export default ColorPicker
