import {
  HistoryActions,
  ImportExport,
  PanelAlerts,
  PanelSections,
  PresetSelect,
  useUndoShortcuts,
} from "@cossplay/editor/panel"
import { usePanelStore } from "@cossplay/editor/store"
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@cossplay/ui/components/tabs"
import { ToastProvider } from "@cossplay/ui/components/toast"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { CustomPreview } from "@/editor/custom"
import { Components, Typography } from "@/editor/gallery"
import { connect } from "@/editor/host"
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

// Laid out like tweakcn's editor: site header, controls on the left, actions and preview on the right.
function Editor() {
  useEffect(connect, [])
  useUndoShortcuts()
  const status = usePanelStore((s) => s.status)
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
            href="/#how"
            className="text-muted-foreground text-sm hover:text-foreground"
          >
            Chrome extension
          </a>
        </header>
        <div className="flex min-h-0 flex-1">
          <aside className="ui-chrome flex w-[30%] min-w-80 max-w-md shrink-0 flex-col border-r text-xs">
            <div className={bar}>
              <PresetSelect />
            </div>
            <PanelAlerts />
            <PanelSections />
          </aside>
          <main className="flex min-w-0 flex-1 flex-col">
            <div className={bar}>
              <span
                role="status"
                className="mr-auto truncate text-muted-foreground text-xs"
              >
                {status}
              </span>
              <HistoryActions />
              <span className="mx-2 h-5 w-px bg-border" />
              <ImportExport />
            </div>
            <Tabs
              defaultValue="components"
              className="flex min-h-0 flex-1 flex-col gap-0"
            >
              <div className="ui-chrome shrink-0 px-4 pt-3 pb-1">
                <TabsList aria-label="Preview">
                  <TabsTab value="components">Components</TabsTab>
                  <TabsTab value="typography">Typography</TabsTab>
                  <TabsTab value="custom">Custom</TabsTab>
                </TabsList>
              </div>
              <TabsPanel
                value="components"
                className="min-h-0 flex-1 overflow-y-auto"
              >
                <Components />
              </TabsPanel>
              <TabsPanel
                value="typography"
                className="m-4 mt-2 min-h-0 flex-1 overflow-y-auto rounded-xl border"
              >
                <Typography />
              </TabsPanel>
              <TabsPanel value="custom" className="min-h-0 flex-1">
                <CustomPreview />
              </TabsPanel>
            </Tabs>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
