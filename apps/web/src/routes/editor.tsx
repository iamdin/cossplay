import { Panel } from "@cossplay/editor/panel"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
import { ToastProvider } from "@/components/ui/toast"
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

function Editor() {
  useEffect(connect, [])
  return (
    <ToastProvider>
      <div className="flex h-dvh overflow-hidden bg-background text-foreground">
        <aside className="w-80 shrink-0 border-r xl:w-96">
          <Panel />
        </aside>
        <Tabs
          defaultValue="components"
          className="flex min-w-0 flex-1 flex-col gap-0"
        >
          <header className="flex shrink-0 items-center gap-4 border-b px-4 py-2">
            <a href="/" className="font-semibold text-sm">
              Cossplay
            </a>
            <TabsList aria-label="Preview">
              <TabsTab value="components">Components</TabsTab>
              <TabsTab value="typography">Typography</TabsTab>
            </TabsList>
          </header>
          <TabsPanel
            value="components"
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <Components />
          </TabsPanel>
          <TabsPanel
            value="typography"
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <Typography />
          </TabsPanel>
        </Tabs>
      </div>
    </ToastProvider>
  )
}
