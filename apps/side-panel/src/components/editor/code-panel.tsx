import { useState } from "react"
import { Check, Copy, Download } from "lucide-react"
import {
  generateThemeCode,
  generateTailwindConfigCode,
  generateLayoutCode,
  generateThemeRegistryItemFromStyles,
  type ColorFormat,
} from "theme-core"

import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEditorStore } from "@/store/editor-store"
import { usePreferencesStore } from "@/store/preferences-store"

// 本地导出无托管 URL，注册表始终以本地文件名引用。
const REGISTRY_FILENAME = "theme-registry.json"
const THEME_NAME = "custom-theme"

/** 选中包管理器对应的本地 registry 安装命令。 */
function getLocalRegistryCommand(pm: "pnpm" | "npm" | "yarn" | "bun"): string {
  const target = `./${REGISTRY_FILENAME}`
  switch (pm) {
    case "pnpm":
      return `pnpm dlx shadcn@latest add ${target}`
    case "npm":
      return `npx shadcn@latest add ${target}`
    case "yarn":
      return `yarn dlx shadcn@latest add ${target}`
    case "bun":
      return `bunx shadcn@latest add ${target}`
  }
}

export function CodePanel() {
  const [activeTab, setActiveTab] = useState("index.css")
  const [cmdCopied, setCmdCopied] = useState(false)

  const styles = useEditorStore((s) => s.themeState.styles)

  const colorFormat = usePreferencesStore((s) => s.colorFormat)
  const tailwindVersion = usePreferencesStore((s) => s.tailwindVersion)
  const packageManager = usePreferencesStore((s) => s.packageManager)
  const setColorFormat = usePreferencesStore((s) => s.setColorFormat)
  const setTailwindVersion = usePreferencesStore((s) => s.setTailwindVersion)
  const setPackageManager = usePreferencesStore((s) => s.setPackageManager)
  const getAvailableColorFormats = usePreferencesStore((s) => s.getAvailableColorFormats)

  const cssCode = generateThemeCode(styles, colorFormat, tailwindVersion)
  const configCode = generateTailwindConfigCode(styles, colorFormat)
  const layoutCode = generateLayoutCode(styles)
  const registryJson = JSON.stringify(
    generateThemeRegistryItemFromStyles(THEME_NAME, styles),
    null,
    2
  )

  const localRegistryCommand = getLocalRegistryCommand(packageManager)

  const downloadRegistry = () => {
    const blob = new Blob([registryJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = REGISTRY_FILENAME
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(localRegistryCommand)
      setCmdCopied(true)
      setTimeout(() => setCmdCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy command:", err)
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 选择器：Tailwind 版本 / 颜色格式 / 包管理器 */}
      <div className="flex flex-none flex-wrap items-center gap-2">
        <Select
          value={tailwindVersion}
          onValueChange={(value: string | null) => {
            if (!value) return
            setTailwindVersion(value as "3" | "4")
            // v4 隐藏 tailwind.config.ts；若它当前激活则切回 index.css。
            if (value === "4" && activeTab === "tailwind.config.ts") {
              setActiveTab("index.css")
            }
          }}
        >
          <SelectTrigger size="sm" className="w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Tailwind v3</SelectItem>
            <SelectItem value="4">Tailwind v4</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={colorFormat}
          onValueChange={(value: string | null) => value && setColorFormat(value as ColorFormat)}
        >
          <SelectTrigger size="sm" className="w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getAvailableColorFormats().map((format) => (
              <SelectItem key={format} value={format}>
                {format}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={packageManager}
          onValueChange={(value: string | null) =>
            value && setPackageManager(value as "pnpm" | "npm" | "yarn" | "bun")
          }
        >
          <SelectTrigger size="sm" className="w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["pnpm", "npm", "yarn", "bun"] as const).map((pm) => (
              <SelectItem key={pm} value={pm}>
                {pm}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
      >
        <TabsList variant="line" className="h-auto flex-none flex-wrap">
          <TabsTrigger value="index.css">index.css</TabsTrigger>
          {tailwindVersion === "3" && (
            <TabsTrigger value="tailwind.config.ts">tailwind.config.ts</TabsTrigger>
          )}
          <TabsTrigger value="layout.tsx">layout.tsx</TabsTrigger>
          <TabsTrigger value="registry.json">registry.json</TabsTrigger>
        </TabsList>

        <TabsContent value="index.css" className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="border-input h-full rounded-none border">
            <CodeBlock code={cssCode} language="css" />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>

        {tailwindVersion === "3" && (
          <TabsContent value="tailwind.config.ts" className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="border-input h-full rounded-none border">
              <CodeBlock code={configCode} language="typescript" />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </TabsContent>
        )}

        <TabsContent value="layout.tsx" className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="border-input h-full rounded-none border">
            <CodeBlock code={layoutCode} language="tsx" />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="registry.json"
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
        >
          <div className="flex flex-none items-center gap-2">
            <Button size="sm" variant="outline" onClick={downloadRegistry}>
              <Download />
              下载 registry JSON
            </Button>
          </div>
          {/* 本地文件安装命令（按所选包管理器） */}
          <div className="border-input bg-muted/50 flex flex-none items-center gap-2 rounded-none border px-2 py-1.5">
            <code className="flex-1 overflow-x-auto font-mono text-xs whitespace-nowrap">
              {localRegistryCommand}
            </code>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={copyCommand}
              aria-label={cmdCopied ? "已复制" : "复制命令"}
            >
              {cmdCopied ? <Check /> : <Copy />}
            </Button>
          </div>
          <p className="text-muted-foreground flex-none text-xs/relaxed">
            提示：托管式 <code>npx shadcn add &lt;url&gt;</code> 需要 tweakcn 账号，不在本扩展范围内。
            请下载上方 JSON 到项目根目录后执行命令。
          </p>
          <ScrollArea className="border-input min-h-0 flex-1 rounded-none border">
            <CodeBlock code={registryJson} language="json" />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CodePanel
