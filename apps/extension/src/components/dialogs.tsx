import {
  exportConfig,
  exportCss,
  exportLayout,
  registryTheme,
  type Theme,
} from "@cossplay/core/coss"
import { Button } from "@cossplay/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@cossplay/ui/components/dialog"
import { Input } from "@cossplay/ui/components/input"
import { Textarea } from "@cossplay/ui/components/textarea"
import { useState } from "react"
import { selectClass } from "@/components/controls"
import fonts from "@/data/fonts.json"
import { importFrom, setError, useSiteStore } from "@/store/site-store"

type DialogProps = { open: boolean; onOpenChange: (open: boolean) => void }

function DialogError() {
  const error = useSiteStore((s) => s.error)
  return error ? (
    <p
      role="alert"
      className="text-destructive text-xs [overflow-wrap:anywhere]"
    >
      {error}
    </p>
  ) : null
}

export function ImportDialog({ open, onOpenChange }: DialogProps) {
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")
  const apply = async () => {
    try {
      await importFrom(text, url)
      onOpenChange(false)
    } catch (e) {
      setError(`Import failed: ${String(e)}`)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-24px)] max-w-[calc(100%-24px)] overflow-auto">
        <DialogHeader>
          <DialogTitle>Import theme</DialogTitle>
        </DialogHeader>
        <DialogError />
        <label
          htmlFor="import-url"
          className="grid gap-1.5 text-[11px] text-muted-foreground"
        >
          Registry or tweakcn theme URL
          <Input
            id="import-url"
            aria-label="Import URL"
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
          Or paste CSS / JSON
          <Textarea
            id="import-text"
            aria-label="Import CSS or JSON"
            rows={12}
            className="font-mono text-[11px]"
            placeholder=":root { … } .dark { … }"
            value={text}
            onChange={(e) => {
              setText(e.currentTarget.value)
              setUrl("")
            }}
          />
        </label>
        <label className="grid gap-1.5 border border-dashed p-2 text-[11px] text-muted-foreground">
          Choose CSS or JSON file
          <input
            aria-label="Import file"
            type="file"
            accept=".css,.json,text/css,application/json"
            onChange={async (e) => {
              const file = e.currentTarget.files?.[0]
              if (!file) return
              if (file.size > 2_000_000) {
                setError("File is too large")
                return
              }
              setText(await file.text())
              setUrl("")
            }}
          />
        </label>
        <Button onClick={apply}>Apply imported theme</Button>
      </DialogContent>
    </Dialog>
  )
}

const exportTypes = {
  v4: { label: "Tailwind v4 · OKLCH CSS", file: "globals.css" },
  v3: { label: "Tailwind v3 · HSL CSS", file: "globals.css" },
  json: { label: "tweakcn / shadcn registry JSON", file: "theme.json" },
  raw: { label: "Light / dark token JSON", file: "tokens.json" },
  config: { label: "Tailwind v3 config", file: "tailwind.config.js" },
  layout: { label: "Next.js font layout", file: "layout.tsx" },
} as const
type ExportType = keyof typeof exportTypes

function exportCode(theme: Theme, type: ExportType) {
  if (type === "json") return JSON.stringify(registryTheme(theme), null, 2)
  if (type === "raw")
    return JSON.stringify({ light: theme.light, dark: theme.dark }, null, 2)
  if (type === "config") return exportConfig()
  if (type === "layout") return exportLayout(theme, fonts)
  return exportCss(theme, type === "v3" ? "3" : "4")
}

export function ExportDialog({
  open,
  onOpenChange,
  theme,
}: DialogProps & { theme: Theme }) {
  const [type, setType] = useState<ExportType>("v4")
  const output = exportCode(theme, type)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      useSiteStore.setState({ status: "Copied to clipboard" })
    } catch (e) {
      setError(`Copy failed: ${String(e)}`)
    }
  }
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
      <DialogContent className="max-h-[calc(100vh-24px)] max-w-[calc(100%-24px)] overflow-auto">
        <DialogHeader>
          <DialogTitle>Export theme</DialogTitle>
        </DialogHeader>
        <DialogError />
        <select
          aria-label="Export format"
          className={selectClass}
          value={type}
          onChange={(e) => setType(e.currentTarget.value as ExportType)}
        >
          {Object.entries(exportTypes).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Textarea
          aria-label="Exported code"
          readOnly
          rows={18}
          className="font-mono text-[11px]"
          value={output}
        />
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={download}>
            Download
          </Button>
          <Button className="flex-1" onClick={copy}>
            Copy code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
