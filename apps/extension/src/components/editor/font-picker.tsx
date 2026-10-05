import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@coss-tweak/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@coss-tweak/ui/components/popover"
import { cn } from "@coss-tweak/ui/lib/utils"
import { Check, ChevronDown } from "lucide-react"
import { useMemo, useState } from "react"
import {
  buildFontFamily,
  FALLBACK_FONTS,
  type FontCategory,
  type FontInfo,
} from "@/lib/fonts"

/**
 * Font picker over the static `FALLBACK_FONTS` list. Each picker is scoped to a
 * single category (sans-serif / serif / monospace).
 */

interface FontPickerProps {
  value?: string
  category: FontCategory
  onSelect: (font: FontInfo) => void
  placeholder?: string
  className?: string
}

export function FontPicker({
  value,
  category,
  onSelect,
  placeholder = "Select font...",
  className,
}: FontPickerProps) {
  const [open, setOpen] = useState(false)

  const fonts = useMemo(
    () => FALLBACK_FONTS.filter((f) => f.category === category),
    [category]
  )

  const currentFamily = useMemo(() => {
    if (!value) return null
    return value.split(",")[0].trim().replace(/['"]/g, "")
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-input/25 px-2.5 text-xs transition-colors hover:bg-muted",
          className
        )}
      >
        {currentFamily ? (
          <span
            className="truncate"
            style={{ fontFamily: buildFontFamily(currentFamily, category) }}
          >
            {currentFamily}
          </span>
        ) : (
          <span className="truncate text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>

      <PopoverContent className="w-[260px] p-0" align="start">
        <Command className="h-72 w-full overflow-hidden">
          <CommandInput className="h-10" placeholder="Search fonts..." />
          <CommandList className="size-full p-1">
            <CommandEmpty>No fonts found.</CommandEmpty>
            <CommandGroup>
              {fonts.map((font) => {
                const isSelected = font.family === currentFamily
                return (
                  <CommandItem
                    key={font.family}
                    value={font.family}
                    onSelect={() => {
                      onSelect(font)
                      setOpen(false)
                    }}
                    className="flex cursor-pointer items-center justify-between gap-2 p-2"
                  >
                    <span
                      className="truncate"
                      style={{
                        fontFamily: buildFontFamily(font.family, font.category),
                      }}
                    >
                      {font.family}
                    </span>
                    {isSelected && (
                      <Check className="size-4 shrink-0 opacity-70" />
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
