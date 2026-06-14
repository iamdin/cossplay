import { useMemo, useState } from "react"
import { AlertTriangle, Check } from "lucide-react"

import {
  CONTRAST_CATEGORIES,
  getContrastRatio,
  MIN_CONTRAST_RATIO,
  toHex,
  type ThemeStyleProps,
} from "theme-core"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/store/editor-store"

type ContrastCheckerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ResolvedPair = {
  key: string
  label: string
  foreground: string
  background: string
  ratio: number
  isValid: boolean
}

/**
 * 对比度检查对话框。基于当前模式 (`themeState.currentMode`) 解析每对 fg/bg 颜色
 * (token 字符串 → hex via `toHex`),用 theme-core 的 `getContrastRatio` 计算 WCAG
 * 比值,并按 `MIN_CONTRAST_RATIO` 判定通过/失败。支持 All/Issues 过滤。
 * Mirrors tweakcn `components/editor/contrast-checker.tsx`,数据源用
 * theme-core `CONTRAST_CATEGORIES`(3 类 11 对)。窄面板:近全屏 + 内部滚动。
 */
const ContrastChecker = ({ open, onOpenChange }: ContrastCheckerProps) => {
  const themeState = useEditorStore((s) => s.themeState)
  const [filter, setFilter] = useState<"all" | "issues">("all")

  const mode = themeState.currentMode
  const styles = themeState.styles[mode] as ThemeStyleProps

  // 解析每个分类下每对颜色 → resolved hex + 对比度。
  const groups = useMemo(() => {
    return CONTRAST_CATEGORIES.map((category) => ({
      name: category.name,
      pairs: category.pairs.map<ResolvedPair>((pair) => {
        const foreground = toHex(styles[pair.foregroundId] ?? "")
        const background = toHex(styles[pair.backgroundId] ?? "")
        const ratio = getContrastRatio(foreground, background)
        return {
          key: `${pair.foregroundId}__${pair.backgroundId}`,
          label: pair.label,
          foreground,
          background,
          ratio,
          isValid: ratio >= MIN_CONTRAST_RATIO,
        }
      }),
    }))
  }, [styles])

  const totalIssues = useMemo(
    () => groups.reduce((sum, g) => sum + g.pairs.filter((p) => !p.isValid).length, 0),
    [groups]
  )

  const visibleGroups = groups
    .map((g) => ({
      ...g,
      pairs: filter === "issues" ? g.pairs.filter((p) => !p.isValid) : g.pairs,
    }))
    .filter((g) => g.pairs.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92dvh] max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-3">
        <DialogHeader>
          <DialogTitle>对比度检查</DialogTitle>
          <DialogDescription>
            WCAG 2.0 AA 要求对比度至少 {MIN_CONTRAST_RATIO}:1。当前模式:
            {mode === "light" ? "亮色" : "暗色"}。
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              filter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            全部
          </button>
          <button
            type="button"
            disabled={totalIssues === 0}
            onClick={() => setFilter("issues")}
            className={cn(
              "flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors disabled:pointer-events-none disabled:opacity-50",
              filter === "issues" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            <AlertTriangle className="size-3" />
            问题 ({totalIssues})
          </button>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 pr-2">
            {visibleGroups.map((group) => (
              <div key={group.name}>
                <div className="bg-background sticky top-0 z-10 flex items-center gap-2 pb-2">
                  <h2 className="text-xs font-semibold">{group.name}</h2>
                  <Separator className="flex-1" />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {group.pairs.map((pair) => (
                    <div
                      key={pair.key}
                      className={cn(
                        "rounded-md border p-2.5",
                        !pair.isValid && "border-destructive/50 border-dashed"
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            !pair.isValid && "text-destructive"
                          )}
                        >
                          {pair.label}
                          {!pair.isValid && <AlertTriangle className="size-3" />}
                        </span>
                        <Badge variant={pair.isValid ? "secondary" : "destructive"}>
                          {pair.isValid ? (
                            <Check className="size-3" />
                          ) : (
                            <AlertTriangle className="size-3" />
                          )}
                          {pair.ratio.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="size-7 shrink-0 rounded-md border"
                              style={{ backgroundColor: pair.background }}
                            />
                            <span className="text-muted-foreground truncate font-mono text-[10px]">
                              背景 {pair.background}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="size-7 shrink-0 rounded-md border"
                              style={{ backgroundColor: pair.foreground }}
                            />
                            <span className="text-muted-foreground truncate font-mono text-[10px]">
                              前景 {pair.foreground}
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex h-16 w-20 shrink-0 items-center justify-center rounded-md border"
                          style={{ backgroundColor: pair.background }}
                        >
                          <div className="text-center" style={{ color: pair.foreground }}>
                            <p className="text-xl font-bold leading-none">Aa</p>
                            <p className="mt-1 text-[10px] font-medium">示例文本</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default ContrastChecker
