import {
  contrast,
  contrastPairs,
  formatColor,
} from "@coss-tweak/theme-core/coss"
import { Badge } from "@coss-tweak/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@coss-tweak/ui/components/dialog"
import { ScrollArea } from "@coss-tweak/ui/components/scroll-area"
import { Separator } from "@coss-tweak/ui/components/separator"
import { cn } from "@coss-tweak/ui/lib/utils"
import { AlertTriangle, Check } from "lucide-react"
import { useMemo, useState } from "react"
import { useSiteStore, useTheme } from "@/store/site-store"

const MIN_CONTRAST_RATIO = 4.5

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
 * 对比度检查对话框。按 coss 的用法检查当前模式下每对 fg/bg:半透明颜色先叠加到
 * background 上再计算 WCAG 比值;info / success / warning / destructive 的 foreground
 * 在 coss 里是页面上的文字色,所以对 background 检查。支持 All/Issues 过滤。
 */
const ContrastChecker = ({ open, onOpenChange }: ContrastCheckerProps) => {
  const theme = useTheme()
  const mode = useSiteStore((s) => s.mode)
  const [filter, setFilter] = useState<"all" | "issues">("all")

  const groups = useMemo(() => {
    if (!theme) return []
    const styles = theme[mode]
    return [
      {
        name: "coss 颜色对",
        pairs: contrastPairs.map<ResolvedPair>((pair) => {
          const ratio = contrast(
            styles[pair.foreground],
            styles[pair.background],
            formatColor(styles.background, "hex")
          )
          return {
            key: `${pair.foreground}__${pair.background}`,
            label: pair.label,
            foreground: formatColor(styles[pair.foreground], "hex"),
            background: formatColor(styles[pair.background], "hex"),
            ratio,
            isValid: ratio >= MIN_CONTRAST_RATIO,
          }
        }),
      },
    ]
  }, [theme, mode])

  const totalIssues = useMemo(
    () =>
      groups.reduce(
        (sum, g) => sum + g.pairs.filter((p) => !p.isValid).length,
        0
      ),
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
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
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
              filter === "issues"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
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
                <div className="sticky top-0 z-10 flex items-center gap-2 bg-background pb-2">
                  <h2 className="font-semibold text-xs">{group.name}</h2>
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
                            "flex items-center gap-1 font-medium text-xs",
                            !pair.isValid && "text-destructive"
                          )}
                        >
                          {pair.label}
                          {!pair.isValid && (
                            <AlertTriangle className="size-3" />
                          )}
                        </span>
                        <Badge
                          variant={pair.isValid ? "secondary" : "destructive"}
                        >
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
                            <span className="truncate font-mono text-[10px] text-muted-foreground">
                              背景 {pair.background}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="size-7 shrink-0 rounded-md border"
                              style={{ backgroundColor: pair.foreground }}
                            />
                            <span className="truncate font-mono text-[10px] text-muted-foreground">
                              前景 {pair.foreground}
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex h-16 w-20 shrink-0 items-center justify-center rounded-md border"
                          style={{ backgroundColor: pair.background }}
                        >
                          <div
                            className="text-center"
                            style={{ color: pair.foreground }}
                          >
                            <p className="font-bold text-xl leading-none">Aa</p>
                            <p className="mt-1 font-medium text-[10px]">
                              示例文本
                            </p>
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
