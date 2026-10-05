import { TAILWIND_PALETTE, toHex } from "@coss-tweak/theme-core"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@coss-tweak/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@coss-tweak/ui/components/popover"
import { ScrollArea } from "@coss-tweak/ui/components/scroll-area"
import { Separator } from "@coss-tweak/ui/components/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@coss-tweak/ui/components/tabs"
import { cn } from "@coss-tweak/ui/lib/utils"
import { Check, LayoutGrid, List, Palette } from "lucide-react"
import { useCallback, useState } from "react"

type ColorSelectorTab = "list" | "palette"

type ColorSelectorPopoverProps = {
  currentColor: string
  onChange: (color: string) => void
}

/**
 * Tailwind palette picker. Ported from tweakcn
 * `components/editor/color-selector-popover.tsx`, adapted to:
 *  - theme-core's `TAILWIND_PALETTE` + `toHex` (instead of culori directly);
 *  - local tab state (tweakcn used a persisted preferences store);
 *  - a plain trigger button + lucide `Palette` icon (no tweakcn TailwindCSS svg).
 */
export function ColorSelectorPopover({
  currentColor,
  onChange,
}: ColorSelectorPopoverProps) {
  const [tab, setTab] = useState<ColorSelectorTab>("list")

  const handleColorSelect = useCallback(
    (color: string) => {
      onChange(color)
    },
    [onChange]
  )

  const isColorSelected = useCallback(
    (color: string) => {
      try {
        return toHex(currentColor) === toHex(color)
      } catch {
        return currentColor === color
      }
    },
    [currentColor]
  )

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Tailwind Colors"
        className="flex size-7 shrink-0 items-center justify-center rounded border bg-input/25 text-foreground shadow-none transition-colors hover:bg-muted"
      >
        <Palette className="size-4" />
      </PopoverTrigger>

      <PopoverContent
        className="size-auto gap-0 overflow-hidden p-0"
        align="end"
      >
        <Tabs value={tab} onValueChange={(v) => setTab(v as ColorSelectorTab)}>
          <div className="flex items-center justify-between gap-4">
            <div className="ml-2 flex items-center gap-1.5">
              <Palette className="size-4" />
              <span className="text-muted-foreground text-sm tabular-nums">
                Tailwind v4
              </span>
            </div>

            <TabsList className="bg-transparent">
              <TabsTrigger
                value="list"
                className="size-8 p-0 data-[state=active]:bg-input/25 data-[state=active]:shadow-none"
              >
                <List className="size-4" />
              </TabsTrigger>
              <TabsTrigger
                value="palette"
                className="size-8 p-0 data-[state=active]:bg-input/25 data-[state=active]:shadow-none"
              >
                <LayoutGrid className="size-4" />
              </TabsTrigger>
            </TabsList>
          </div>
          <Separator />

          <TabsContent value="list" className="my-0 min-w-[260px]">
            <Command className="flex h-72 flex-col">
              <CommandInput
                className="h-10"
                placeholder="Search Tailwind colors..."
              />
              <ScrollArea className="flex-1 overflow-hidden">
                <CommandEmpty className="p-4 text-center text-muted-foreground">
                  No Tailwind color found.
                </CommandEmpty>

                {Object.entries(TAILWIND_PALETTE).map(([key, colors]) => {
                  const colorName = key.charAt(0).toUpperCase() + key.slice(1)
                  return (
                    <CommandGroup heading={colorName} key={key}>
                      {Object.entries(colors).map(([shade, color]) => {
                        const isSelected = isColorSelected(color)
                        const swatchName =
                          shade === "DEFAULT" ? key : `${key}-${shade}`

                        return (
                          <CommandItem
                            key={color}
                            value={`${swatchName} ${color}`}
                            onSelect={() => handleColorSelect(color)}
                            className="flex items-center gap-2"
                          >
                            <ColorSwatch
                              color={color}
                              name={swatchName}
                              isSelected={isSelected}
                              size="md"
                            />
                            <span>{swatchName}</span>
                            {isSelected && (
                              <Check className="ml-auto size-4 opacity-70" />
                            )}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  )
                })}
              </ScrollArea>
            </Command>
          </TabsContent>

          <TabsContent value="palette" className="my-0 w-full">
            <ScrollArea className="h-72 w-full">
              <div className="flex flex-col gap-0.5 p-1">
                {Object.entries(TAILWIND_PALETTE).map(([key, colors]) => (
                  <div key={key} className="flex gap-0.5">
                    {Object.entries(colors).map(([shade, color]) => (
                      <ColorSwatch
                        key={`${key}-${shade}`}
                        name={shade === "DEFAULT" ? key : `${key}-${shade}`}
                        color={color}
                        isSelected={isColorSelected(color)}
                        onClick={() => handleColorSelect(color)}
                        className="rounded-none"
                        size="md"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

interface ColorSwatchProps extends React.HTMLAttributes<HTMLButtonElement> {
  isSelected: boolean
  color: string
  name: string
  size?: "sm" | "md" | "lg"
}

function ColorSwatch({
  color,
  name,
  className,
  isSelected,
  size = "sm",
  ...props
}: ColorSwatchProps) {
  const sizeClasses = {
    sm: "size-5",
    md: "size-6",
    lg: "size-8",
  }

  const isTransparent = color === "transparent"

  return (
    <button
      aria-label={`Select color ${name}`}
      title={name}
      className={cn(
        "group relative cursor-pointer rounded-md border transition-all hover:z-10 hover:scale-110 hover:shadow-lg",
        isTransparent
          ? "[background-image:linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] [background-position:0_0,0_4px,4px_-4px,-4px_0px] [background-size:8px_8px]"
          : "bg-(--color)",
        sizeClasses[size],
        isSelected &&
          (isTransparent ? "ring-2 ring-border" : "ring-(--color) ring-2"),
        className
      )}
      style={
        !isTransparent
          ? ({ "--color": color } as React.CSSProperties)
          : undefined
      }
      {...props}
    >
      <div className="absolute inset-0 rounded-[inherit] ring-2 ring-transparent transition-all duration-200 group-hover:ring-foreground/50" />
    </button>
  )
}
