import {
  exportConfig,
  exportCss,
  exportLayout,
  registryTheme,
  registryUrl,
  type Theme,
} from "@cossplay/core/coss"
import { Button } from "@cossplay/ui/components/button"
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@cossplay/ui/components/dialog"
import { Input } from "@cossplay/ui/components/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@cossplay/ui/components/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@cossplay/ui/components/tabs"
import { Textarea } from "@cossplay/ui/components/textarea"
import { Copy } from "lucide-react"
import { useState } from "react"
import fonts from "./fonts.json"
import { importFrom, setError, usePanelStore } from "./store"

type DialogProps = { open: boolean; onOpenChange: (open: boolean) => void }

function DialogError() {
  const error = usePanelStore((s) => s.error)
  return error ? (
    <p
      role="alert"
      className="text-destructive text-xs [overflow-wrap:anywhere]"
    >
      {error}
    </p>
  ) : null
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    usePanelStore.setState({ status: "已复制到剪贴板" })
  } catch (e) {
    setError(`复制失败：${String(e)}`)
  }
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="flex min-w-0 items-start gap-1 rounded-lg border bg-muted/50 p-2">
      <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed">
        {code}
      </pre>
      <Button
        size="icon-xs"
        variant="ghost"
        aria-label={`复制${label}`}
        title="复制"
        onClick={() => copyText(code)}
      >
        <Copy />
      </Button>
    </div>
  )
}

export function ImportDialog({ open, onOpenChange }: DialogProps) {
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")
  const apply = async () => {
    try {
      await importFrom(text, url)
      onOpenChange(false)
    } catch (e) {
      setError(`导入失败：${String(e)}`)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="ui-chrome">
        <DialogHeader>
          <DialogTitle>导入主题</DialogTitle>
        </DialogHeader>
        <DialogPanel className="grid gap-4">
          <DialogError />
          <label
            htmlFor="import-url"
            className="grid gap-1.5 text-[11px] text-muted-foreground"
          >
            注册表或 tweakcn 主题 URL
            <Input
              className="text-sm"
              size="sm"
              id="import-url"
              aria-label="导入 URL"
              type="url"
              placeholder="https://tweakcn.com/r/themes/…json"
              value={url}
              onChange={(e) => {
                setUrl(e.currentTarget.value)
                setText("")
              }}
            />
          </label>
          <label
            htmlFor="import-text"
            className="grid gap-1.5 text-[11px] text-muted-foreground"
          >
            或粘贴 CSS / JSON
            <Textarea
              id="import-text"
              aria-label="导入 CSS 或 JSON"
              rows={12}
              className="font-mono text-xs"
              placeholder=":root { … } .dark { … }"
              value={text}
              onChange={(e) => {
                setText(e.currentTarget.value)
                setUrl("")
              }}
            />
          </label>
          <label className="grid gap-1.5 rounded-lg border border-dashed p-3 text-[11px] text-muted-foreground">
            选择 CSS 或 JSON 文件
            <input
              aria-label="导入文件"
              type="file"
              accept=".css,.json,text/css,application/json"
              onChange={async (e) => {
                const file = e.currentTarget.files?.[0]
                if (!file) return
                if (file.size > 2_000_000) {
                  setError("文件太大")
                  return
                }
                setText(await file.text())
                setUrl("")
              }}
            />
          </label>
        </DialogPanel>
        <DialogFooter>
          <Button onClick={apply}>应用导入的主题</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}

const exportTypes = {
  v4: { label: "Tailwind v4 · OKLCH CSS", file: "globals.css" },
  v3: { label: "Tailwind v3 · HSL CSS", file: "globals.css" },
  json: { label: "tweakcn / shadcn 注册表 JSON", file: "theme.json" },
  raw: { label: "浅色 / 深色 token JSON", file: "tokens.json" },
  config: { label: "Tailwind v3 配置", file: "tailwind.config.js" },
  layout: { label: "Next.js 字体布局", file: "layout.tsx" },
} as const
type ExportType = keyof typeof exportTypes
const exportItems = Object.entries(exportTypes).map(([value, { label }]) => ({
  value,
  label,
}))

function exportCode(theme: Theme, type: ExportType) {
  if (type === "json") return JSON.stringify(registryTheme(theme), null, 2)
  if (type === "raw")
    return JSON.stringify({ light: theme.light, dark: theme.dark }, null, 2)
  if (type === "config") return exportConfig()
  if (type === "layout") return exportLayout(theme, fonts)
  return exportCss(theme, type === "v3" ? "3" : "4")
}

const runners = {
  pnpm: "pnpm dlx",
  npm: "npx",
  yarn: "yarn dlx",
  bun: "bunx --bun",
} as const

/** 未改动的预设给出 `shadcn add`；其余用下面的 CSS 导出。 */
function InstallCommand({ presetId }: { presetId: string }) {
  if (!presetId)
    return (
      <p className="text-muted-foreground text-xs">
        shadcn CLI 命令只适用于未改动的预设。这个主题请用下面的 CSS 导出。
      </p>
    )
  return (
    <Tabs defaultValue="pnpm" className="min-w-0 gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium text-sm">用 shadcn CLI 安装</h3>
        <TabsList aria-label="包管理器">
          {Object.keys(runners).map((pm) => (
            <TabsTrigger key={pm} value={pm} className="text-xs">
              {pm}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {Object.entries(runners).map(([pm, runner]) => (
        <TabsContent key={pm} value={pm} className="min-w-0">
          <CodeBlock
            label="安装命令"
            code={`${runner} shadcn@latest add ${registryUrl}/${presetId}.json`}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}

export function ExportDialog({
  open,
  onOpenChange,
  theme,
  presetId,
}: DialogProps & { theme: Theme; presetId: string }) {
  const [type, setType] = useState<ExportType>("v4")
  const output = exportCode(theme, type)
  const download = () => {
    const url = URL.createObjectURL(new Blob([output], { type: "text/plain" }))
    const a = document.createElement("a")
    a.href = url
    a.download = exportTypes[type].file
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="ui-chrome max-w-2xl">
        <DialogHeader>
          <DialogTitle>导出主题</DialogTitle>
        </DialogHeader>
        <DialogPanel className="grid gap-4">
          <DialogError />
          <InstallCommand presetId={presetId} />
          <Select
            items={exportItems}
            value={type}
            onValueChange={(value) => value && setType(value as ExportType)}
          >
            <SelectTrigger className="text-sm" aria-label="导出格式">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup className="ui-chrome">
              {exportItems.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
          <Textarea
            aria-label="导出的代码"
            readOnly
            rows={16}
            className="font-mono text-xs"
            value={output}
          />
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline" onClick={download}>
            下载
          </Button>
          <Button onClick={() => copyText(output)}>复制代码</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}

const mcpClients = {
  cursor: {
    label: "Cursor",
    file: ".cursor/mcp.json",
    key: "mcpServers",
  },
  windsurf: {
    label: "Windsurf",
    file: "~/.codeium/windsurf/mcp_config.json",
    key: "mcpServers",
  },
  claude: { label: "Claude Code", file: ".mcp.json", key: "mcpServers" },
  vscode: { label: "VS Code", file: ".vscode/mcp.json", key: "servers" },
} as const
const json = (value: unknown) => JSON.stringify(value, null, 2)

/** 让 AI 编辑器通过 shadcn 的注册表 MCP 服务浏览并安装预设。 */
export function McpDialog({ open, onOpenChange }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="ui-chrome max-w-2xl">
        <DialogHeader>
          <DialogTitle>用于 AI 编辑器（MCP）</DialogTitle>
        </DialogHeader>
        <DialogPanel className="grid gap-4 text-xs">
          <DialogError />
          <p className="text-muted-foreground">
            1. 把 Cossplay 注册表加到项目的 <code>components.json</code>：
          </p>
          <CodeBlock
            label="components.json 注册表"
            code={json({
              registries: { "@cossplay": `${registryUrl}/{name}.json` },
            })}
          />
          <p className="text-muted-foreground">
            2. 把 shadcn 的 MCP 服务加到编辑器，然后让它从 @cossplay
            取一个主题。
          </p>
          <Tabs defaultValue="cursor" className="min-w-0 gap-2">
            <TabsList aria-label="编辑器">
              {Object.entries(mcpClients).map(([id, { label }]) => (
                <TabsTrigger key={id} value={id} className="text-xs">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(mcpClients).map(([id, { file, key }]) => (
              <TabsContent key={id} value={id} className="grid min-w-0 gap-2">
                <p className="text-muted-foreground">
                  <code>{file}</code>
                </p>
                <CodeBlock
                  label="MCP 配置"
                  code={json({
                    [key]: {
                      shadcn: {
                        command: "npx",
                        args: ["shadcn@latest", "mcp"],
                      },
                    },
                  })}
                />
              </TabsContent>
            ))}
          </Tabs>
          <p className="text-muted-foreground">
            注册表索引：<code>{registryUrl}/registry.json</code>
          </p>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  )
}
