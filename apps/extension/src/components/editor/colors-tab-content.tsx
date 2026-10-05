import type { ColorToken, Token } from "@coss-tweak/theme-core/coss"
import { ScrollArea } from "@coss-tweak/ui/components/scroll-area"
import { cn } from "@coss-tweak/ui/lib/utils"
import { RefreshCw, Search, X } from "lucide-react"
import { useMemo, useState } from "react"
import ColorPicker from "@/components/editor/color-picker"
import ControlSection from "@/components/editor/control-section"
import { syncSidebar, useSiteStore } from "@/store/site-store"

/**
 * Grouped controls for coss ui's 41 color tokens. Ported from tweakcn
 * `components/editor/colors-tab-content.tsx`, with coss's semantic (info / success /
 * warning) and code groups. Sidebar sync lives in the site state, so it is undoable
 * and shared with other panels.
 */

type ColorEntry = {
  key: ColorToken
  label: string
}

type ColorGroup = {
  title: string
  expanded?: boolean
  colors: ColorEntry[]
}

const COLOR_GROUPS: ColorGroup[] = [
  {
    title: "Primary",
    expanded: true,
    colors: [
      { key: "primary", label: "Background" },
      { key: "primary-foreground", label: "Foreground" },
    ],
  },
  {
    title: "Secondary",
    expanded: true,
    colors: [
      { key: "secondary", label: "Background" },
      { key: "secondary-foreground", label: "Foreground" },
    ],
  },
  {
    title: "Accent",
    colors: [
      { key: "accent", label: "Background" },
      { key: "accent-foreground", label: "Foreground" },
    ],
  },
  {
    title: "Base",
    colors: [
      { key: "background", label: "Background" },
      { key: "foreground", label: "Foreground" },
    ],
  },
  {
    title: "Card",
    colors: [
      { key: "card", label: "Background" },
      { key: "card-foreground", label: "Foreground" },
    ],
  },
  {
    title: "Popover",
    colors: [
      { key: "popover", label: "Background" },
      { key: "popover-foreground", label: "Foreground" },
    ],
  },
  {
    title: "Muted",
    colors: [
      { key: "muted", label: "Background" },
      { key: "muted-foreground", label: "Foreground" },
    ],
  },
  {
    title: "Destructive",
    colors: [
      { key: "destructive", label: "Background" },
      { key: "destructive-foreground", label: "Foreground" },
    ],
  },
  {
    title: "Info",
    colors: [
      { key: "info", label: "Background" },
      { key: "info-foreground", label: "Foreground" },
    ],
  },
  {
    title: "Success",
    colors: [
      { key: "success", label: "Background" },
      { key: "success-foreground", label: "Foreground" },
    ],
  },
  {
    title: "Warning",
    colors: [
      { key: "warning", label: "Background" },
      { key: "warning-foreground", label: "Foreground" },
    ],
  },
  {
    title: "Border & Input",
    colors: [
      { key: "border", label: "Border" },
      { key: "input", label: "Input" },
      { key: "ring", label: "Ring" },
    ],
  },
  {
    title: "Chart",
    colors: [
      { key: "chart-1", label: "Chart 1" },
      { key: "chart-2", label: "Chart 2" },
      { key: "chart-3", label: "Chart 3" },
      { key: "chart-4", label: "Chart 4" },
      { key: "chart-5", label: "Chart 5" },
    ],
  },
  {
    title: "Sidebar",
    colors: [
      { key: "sidebar", label: "Background" },
      { key: "sidebar-foreground", label: "Foreground" },
      { key: "sidebar-primary", label: "Primary" },
      { key: "sidebar-primary-foreground", label: "Primary FG" },
      { key: "sidebar-accent", label: "Accent" },
      { key: "sidebar-accent-foreground", label: "Accent FG" },
      { key: "sidebar-border", label: "Border" },
      { key: "sidebar-ring", label: "Ring" },
    ],
  },
  {
    title: "Code",
    colors: [
      { key: "code", label: "Background" },
      { key: "code-foreground", label: "Foreground" },
      { key: "code-highlight", label: "Highlight" },
    ],
  },
]

interface ColorsTabContentProps {
  currentStyles: Record<Token, string>
  updateStyle: (key: Token, value: string) => void
}

export function ColorsTabContent({
  currentStyles,
  updateStyle,
}: ColorsTabContentProps) {
  const [search, setSearch] = useState("")
  const sidebarSyncEnabled = useSiteStore((s) => !!s.site?.current.sidebarSync)

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return COLOR_GROUPS

    const query = search.toLowerCase()
    return COLOR_GROUPS.map((group) => ({
      ...group,
      expanded: true,
      colors: group.colors.filter(
        (c) =>
          c.label.toLowerCase().includes(query) ||
          c.key.toLowerCase().includes(query) ||
          group.title.toLowerCase().includes(query)
      ),
    })).filter((group) => group.colors.length > 0)
  }, [search])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-1 pb-3">
        <div className="flex items-center gap-2.5 rounded-lg border bg-muted/50 px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search colors..."
            className="h-9 min-w-0 flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-1">
        {filteredGroups.length === 0 && (
          <p className="py-8 text-center text-muted-foreground text-xs">
            No colors found
          </p>
        )}
        {filteredGroups.map((group) => (
          <ControlSection
            key={group.title}
            title={group.title}
            expanded={group.expanded}
            headerAction={
              group.title === "Sidebar" ? (
                <button
                  type="button"
                  title="Sync sidebar colors to their base counterparts"
                  onClick={syncSidebar}
                  className={cn(
                    "group inline-flex h-auto items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] transition-colors",
                    sidebarSyncEnabled
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <RefreshCw className="size-3 transition-all group-hover:scale-110" />
                  <span className="uppercase tracking-wider">
                    {sidebarSyncEnabled ? "Sync on" : "Sync"}
                  </span>
                </button>
              ) : undefined
            }
          >
            {group.colors.map((color) => (
              <ColorPicker
                key={color.key}
                name={color.key}
                color={currentStyles[color.key]}
                onChange={(value) => updateStyle(color.key, value)}
                label={color.label}
              />
            ))}
          </ControlSection>
        ))}
      </ScrollArea>
    </div>
  )
}
