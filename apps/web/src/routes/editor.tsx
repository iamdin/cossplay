import {
  HistoryActions,
  ImportExport,
  PanelAlerts,
  PanelSections,
  PresetSelect,
  useUndoShortcuts,
} from "@cossplay/editor/panel"
import { usePanelStore } from "@cossplay/editor/store"
import { Button } from "@cossplay/ui/components/button"
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@cossplay/ui/components/menu"
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@cossplay/ui/components/tabs"
import { ToastProvider } from "@cossplay/ui/components/toast"
import { cn } from "@cossplay/ui/lib/utils"
import { createFileRoute } from "@tanstack/react-router"
import { ChevronDownIcon, Maximize2Icon, Minimize2Icon } from "lucide-react"
import { useEffect, useState } from "react"
import { CustomPreview } from "@/editor/custom"
import {
  ParticleGallery,
  particleCategories,
  Typography,
} from "@/editor/gallery"
import { GettingStarted } from "@/editor/getting-started"
import { connect } from "@/editor/host"
import { PreviewInspector } from "@/editor/inspect"
import { Palette } from "@/editor/palette"
import styles from "@/styles/editor.css?url"

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "Editor — Cossplay" },
      {
        name: "description",
        content:
          "Design a coss ui theme in the browser: presets, colors, fonts and radius on real coss ui components, exported as Tailwind CSS.",
      },
    ],
    links: [{ rel: "stylesheet", href: styles }],
  }),
  component: Editor,
})

const bar = "ui-chrome flex h-14 shrink-0 items-center gap-1 border-b px-3"

const pages = [
  { id: "custom", label: "Custom", Page: CustomPreview },
  { id: "typography", label: "Typography", Page: Typography },
  { id: "palette", label: "Color Palette", Page: Palette },
] as const

type PreviewPage = (typeof pages)[number]["id"]

function isPreviewPage(value: string): value is PreviewPage {
  return pages.some((item) => item.id === value)
}

// Catalog labels set the button width. "Particles" is only the resting caption.
function WidestLabel({
  labels,
  current,
}: {
  labels: readonly string[]
  current: string
}) {
  return (
    <span className="grid">
      {labels.map((label) => (
        <span key={label} className="invisible col-start-1 row-start-1">
          {label}
        </span>
      ))}
      <span className="col-start-1 row-start-1">{current}</span>
    </span>
  )
}

const widthKey = "cossplay:panel-width"

// Laid out like tweakcn's editor: site header, controls on the left, actions and preview on the right.
function Editor() {
  useEffect(connect, [])
  useUndoShortcuts()
  const status = usePanelStore((s) => s.status)
  const initialCategory = particleCategories[0]?.id
  const [page, setPage] = useState<PreviewPage | null>(
    initialCategory ? null : "custom"
  )
  const [categoryId, setCategoryId] = useState(initialCategory ?? "")
  const category = particleCategories.find((item) => item.id === categoryId)
  const particleLabel = page === null && category ? category.label : "Particles"
  const [full, setFull] = useState(false)
  const [width, setWidth] = useState<number>()
  useEffect(() => {
    if (!full) return
    // Escape leaves fullscreen unless something open (a dialog, a menu, inspect) took it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) setFull(false)
    }
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  }, [full])
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(widthKey))
      if (saved) setWidth(saved)
    } catch {}
  }, [])
  const resize = (next: number) => {
    const clamped = Math.round(
      Math.min(Math.max(next, 320), window.innerWidth * 0.6)
    )
    setWidth(clamped)
    try {
      localStorage.setItem(widthKey, String(clamped))
    } catch {}
  }
  return (
    <ToastProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <header className="ui-chrome flex h-14 shrink-0 items-center justify-between border-b px-4">
          <a href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-6 place-items-center rounded-md bg-foreground">
              <span className="size-2.5 rounded-full border-2 border-background" />
            </span>
            Cossplay
          </a>
          <a
            href="/#ways"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Chrome extension
          </a>
        </header>
        <div className="flex min-h-0 flex-1">
          <aside
            className={cn(
              "ui-chrome flex min-w-80 shrink-0 flex-col text-xs",
              !width && "w-[30%] max-w-md"
            )}
            // max-width re-clamps a width saved on a wider window.
            style={width ? { width, maxWidth: "60vw" } : undefined}
            // A control focused from fullscreen (an inspector pick) must be seen.
            onFocus={() => setFull(false)}
          >
            <div className={bar}>
              <PresetSelect />
            </div>
            <GettingStarted />
            <PanelAlerts />
            <PanelSections />
          </aside>
          {/* A focusable separator is the ARIA pattern for a splitter. */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panel"
            aria-valuenow={width}
            tabIndex={0}
            className="relative w-px shrink-0 cursor-col-resize bg-border outline-none before:absolute before:inset-y-0 before:-right-1 before:-left-1 hover:bg-ring focus-visible:bg-ring"
            onPointerDown={(e) => {
              e.preventDefault()
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                resize(e.clientX)
            }}
            onKeyDown={(e) => {
              const step = { ArrowLeft: -16, ArrowRight: 16 }[e.key]
              if (step) resize(e.currentTarget.offsetLeft + step)
            }}
          />
          <main
            className={cn(
              "flex min-w-0 flex-1 flex-col",
              full && "fixed inset-0 z-40 bg-background"
            )}
          >
            <div className={bar}>
              <span
                role="status"
                className="mr-auto truncate text-xs text-muted-foreground"
              >
                {status}
              </span>
              <PreviewInspector />
              <HistoryActions />
              <span className="mx-2 h-5 w-px bg-border" />
              <ImportExport />
            </div>
            <Tabs
              value={page ?? ""}
              onValueChange={(value) => {
                if (isPreviewPage(value)) setPage(value)
              }}
              className="flex min-h-0 flex-1 flex-col gap-0"
            >
              <div className="ui-chrome flex shrink-0 flex-wrap items-center gap-2 px-4 pt-3 pb-1">
                <Menu>
                  <MenuTrigger
                    render={
                      <Button
                        aria-label={particleLabel}
                        variant={page === null ? "secondary" : "ghost"}
                        size="sm"
                      />
                    }
                  >
                    <WidestLabel
                      labels={particleCategories.map((item) => item.label)}
                      current={particleLabel}
                    />
                    <ChevronDownIcon />
                  </MenuTrigger>
                  <MenuPopup className="ui-chrome" align="start">
                    <MenuGroup>
                      <MenuGroupLabel>Particles</MenuGroupLabel>
                      <MenuRadioGroup
                        value={page === null ? categoryId : ""}
                        onValueChange={(id) => {
                          setCategoryId(id)
                          setPage(null)
                        }}
                      >
                        {particleCategories.map((item) => (
                          <MenuRadioItem
                            key={item.id}
                            value={item.id}
                            closeOnClick
                          >
                            {item.label}
                          </MenuRadioItem>
                        ))}
                      </MenuRadioGroup>
                    </MenuGroup>
                  </MenuPopup>
                </Menu>
                <TabsList aria-label="Preview">
                  {pages.map((item) => (
                    <TabsTab key={item.id} value={item.id}>
                      {item.label}
                    </TabsTab>
                  ))}
                </TabsList>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto"
                  aria-label={full ? "Exit fullscreen" : "Fullscreen"}
                  aria-pressed={full}
                  onClick={() => setFull(!full)}
                >
                  {full ? <Minimize2Icon /> : <Maximize2Icon />}
                </Button>
              </div>
              {page === null ? (
                <div className="@container min-h-0 flex-1 overflow-y-auto">
                  <ParticleGallery key={categoryId} category={categoryId} />
                </div>
              ) : null}
              {pages.map((item) => (
                <TabsPanel
                  key={item.id}
                  value={item.id}
                  // The custom preview's frame keeps the user's app state across tab switches.
                  keepMounted={item.id === "custom"}
                  className={
                    item.id === "custom"
                      ? "min-h-0 flex-1"
                      : "@container min-h-0 flex-1 overflow-y-auto"
                  }
                >
                  <item.Page />
                </TabsPanel>
              ))}
            </Tabs>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
