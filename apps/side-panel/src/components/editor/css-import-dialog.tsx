import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { parseCssInput } from "theme-core"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useEditorStore } from "@/store/editor-store"

interface CssImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PLACEHOLDER = `:root {
  --background: oklch(1 0 0);
  --foreground: #1a1a1a;
  --primary: hsl(220 90% 56%);
  --secondary: rgb(244 244 245);
  /* 更多变量… */
}
.dark {
  --background: oklch(0.2 0 0);
  --foreground: #fafafa;
  /* 更多变量… */
}`

/**
 * 导入自定义 CSS：解析 :root / .dark 中的颜色变量并合并进当前主题。
 * 移植自 tweakcn `CssImportDialog` + `handleCssImport`。
 */
export function CssImportDialog({ open, onOpenChange }: CssImportDialogProps) {
  const [cssText, setCssText] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleImport = () => {
    if (!cssText.trim()) {
      setError("请输入 CSS 内容")
      return
    }
    // 基础校验：应包含形如 --primary: #color 的变量定义。
    if (!cssText.includes("--") || !cssText.includes(":")) {
      setError("CSS 格式无效，应包含类似 --primary: #color 的变量定义")
      return
    }

    const { lightColors, darkColors } = parseCssInput(cssText)

    const s = useEditorStore.getState()
    const next = {
      ...s.themeState,
      styles: {
        ...s.themeState.styles,
        light: { ...s.themeState.styles.light, ...lightColors },
        dark: { ...s.themeState.styles.dark, ...darkColors },
      },
    }
    s.setThemeState(next)

    setCssText("")
    setError(null)
    onOpenChange(false)
  }

  const handleClose = () => {
    setCssText("")
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] max-w-[min(92vw,560px)] flex-col gap-3">
        <DialogHeader>
          <DialogTitle>导入自定义 CSS</DialogTitle>
          <DialogDescription>
            粘贴 CSS 以覆盖主题颜色。支持 oklch / hsl / rgb / hex，需包含 --primary、--background 等变量。
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-destructive flex items-center gap-2 text-xs">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
