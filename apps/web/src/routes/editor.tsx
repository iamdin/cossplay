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
import { type ComponentType, useEffect, useState } from "react"
import { Application } from "@/editor/application"
import { Cards } from "@/editor/cards"
import { CustomPreview } from "@/editor/custom"
import { Dashboard } from "@/editor/dashboard"
import { Components, Typography } from "@/editor/gallery"
import { connect } from "@/editor/host"
import { PreviewInspector } from "@/editor/inspect"
import { Mail } from "@/editor/mail"
import { Marketing } from "@/editor/marketing"
import { Palette } from "@/editor/palette"
import styles from "@/styles/editor.css?url"

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "编辑器 — Cossplay" },
      {
        name: "description",
        content:
          "在浏览器里设计 coss ui 主题：在真实 coss ui 组件上调整预设、颜色、字体和圆角，并导出为 Tailwind CSS。",
      },
    ],
    links: [{ rel: "stylesheet", href: styles }],
  }),
  component: Editor,
})

const bar = "ui-chrome flex h-14 shrink-0 items-center gap-1 border-b px-3"

// 预览页，布局同 tweakcn；放不下的收进「更多」。
const pages: [string, string, ComponentType][] = [
  ["cards", "卡片", Cards],
  ["dashboard", "仪表盘", Dashboard],
  ["marketing", "营销页", Marketing],
  ["application", "应用", Application],
  ["components", "组件", Components],
  ["custom", "自定义", CustomPreview],
]
const more: [string, string, ComponentType][] = [
  ["mail", "邮件", Mail],
  ["typography", "排版", Typography],
  ["palette", "色板", Palette],
]

const widthKey = "cossplay:panel-width"

// 布局同 tweakcn 的 Editor：顶栏、左侧控件、右侧操作与 Preview。
function Editor() {
  useEffect(connect, [])
  useUndoShortcuts()
  const status = usePanelStore((s) => s.status)
  const [tab, setTab] = useState("cards")
  const [full, setFull] = useState(false)
  const [width, setWidth] = useState<number>()
  useEffect(() => {
    if (!full) return
    // Escape 退出全屏，除非已打开的对话框、菜单或检查先接住了它。
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
  const overflow = more.find(([value]) => value === tab)
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
            Chrome 扩展
          </a>
        </header>
        <div className="flex min-h-0 flex-1">
          <aside
            className={cn(
              "ui-chrome flex min-w-80 shrink-0 flex-col text-xs",
              !width && "w-[30%] max-w-md"
            )}
            // max-width 会把在更宽窗口里存下的宽度再夹回来。
            style={width ? { width, maxWidth: "60vw" } : undefined}
            // 全屏时从检查点进来的控件必须能看见。
            onFocus={() => setFull(false)}
          >
            <div className={bar}>
              <PresetSelect />
            </div>
            <PanelAlerts />
            <PanelSections />
          </aside>
          {/* biome-ignore lint/a11y/useSemanticElements: 可聚焦的分隔条是分割条的 ARIA 模式。 */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="调整面板宽度"
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
                className="mr-auto truncate text-muted-foreground text-xs"
              >
                {status}
              </span>
              <PreviewInspector />
              <HistoryActions />
              <span className="mx-2 h-5 w-px bg-border" />
              <ImportExport />
            </div>
            <Tabs
              value={tab}
              onValueChange={setTab}
              className="flex min-h-0 flex-1 flex-col gap-0"
            >
              <div className="ui-chrome flex shrink-0 flex-wrap items-center gap-2 px-4 pt-3 pb-1">
                <TabsList aria-label="预览">
                  {pages.map(([value, label]) => (
                    <TabsTab key={value} value={value}>
                      {label}
                    </TabsTab>
                  ))}
                </TabsList>
                <Menu>
                  <MenuTrigger
                    render={
                      <Button
                        variant={overflow ? "secondary" : "ghost"}
                        size="sm"
                      />
                    }
                  >
                    {overflow?.[1] ?? "更多"}
                    <ChevronDownIcon />
                  </MenuTrigger>
                  <MenuPopup className="ui-chrome" align="start">
                    <MenuRadioGroup value={tab} onValueChange={setTab}>
                      {more.map(([value, label]) => (
                        <MenuRadioItem key={value} value={value} closeOnClick>
                          {label}
                        </MenuRadioItem>
                      ))}
                    </MenuRadioGroup>
                  </MenuPopup>
                </Menu>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto"
                  aria-label={full ? "退出全屏" : "全屏"}
                  aria-pressed={full}
                  onClick={() => setFull(!full)}
                >
                  {full ? <Minimize2Icon /> : <Maximize2Icon />}
                </Button>
              </div>
              {[...pages, ...more].map(([value, , Page]) => (
                <TabsPanel
                  key={value}
                  value={value}
                  // 自定义预览的框架在切换标签时保留用户应用的状态。
                  keepMounted={value === "custom"}
                  className={
                    value === "custom"
                      ? "min-h-0 flex-1"
                      : "@container min-h-0 flex-1 overflow-y-auto"
                  }
                >
                  <Page />
                </TabsPanel>
              ))}
            </Tabs>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
