import { useState } from "react"
import { AlertCircle } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@coss-tweak/ui/components/dialog"
import { Button } from "@coss-tweak/ui/components/button"
import { Input } from "@coss-tweak/ui/components/input"
import { Textarea } from "@coss-tweak/ui/components/textarea"
import { importFrom } from "@/store/site-store"

interface CssImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PLACEHOLDER = `:root {
  --background: oklch(1 0 0);
  --foreground: #1a1a1a;
  --primary: hsl(220 90% 56%);
  --success: rgb(16 185 129);
  /* 更多变量… */
}

.dark {
  --background: oklch(0.2 0 0);
  --foreground: #fafafa;
  /* 更多变量… */
}`

/**
 * 导入主题：粘贴 :root / .dark / @theme CSS 或 tweakcn / shadcn registry JSON，或填写其 URL
 * （tweakcn 主题链接会转换为 registry URL）。只覆盖其中定义的 coss token，作为一个可撤销步骤。
 */
export function CssImportDialog({ open, onOpenChange }: CssImportDialogProps) {
  const [cssText, setCssText] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setCssText("")
    setUrl("")
    setError(null)
    onOpenChange(false)
  }

  const handleImport = async () => {
    if (!cssText.trim() && !url.trim()) {
      setError("请输入 CSS / JSON 内容或 URL")
      return
    }
    try {
      await importFrom(cssText, url)
    } catch (e) {
      setError(`导入失败：${String(e)}`)
      return
    }
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] max-w-[min(92vw,560px)] flex-col gap-3">
        <DialogHeader>
          <DialogTitle>导入主题</DialogTitle>
          <DialogDescription>
            粘贴 CSS 或 JSON，或填写 tweakcn / registry URL。颜色支持 oklch / hsl / rgb / hex / lab，未定义的 token 保持网站原值。
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-destructive flex items-center gap-2 text-xs">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          type="url"
          placeholder="https://tweakcn.com/themes/… 或 registry JSON URL"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            if (error) setError(null)
          }}
        />

        <Textarea
          placeholder={PLACEHOLDER}
          className="max-h-[50dvh] min-h-[240px] resize-none font-mono text-xs"
          value={cssText}
          onChange={(e) => {
            setCssText(e.target.value)
            if (error) setError(null)
          }}
        />

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            取消
          </Button>
          <Button size="sm" onClick={handleImport}>
            导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CssImportDialog
