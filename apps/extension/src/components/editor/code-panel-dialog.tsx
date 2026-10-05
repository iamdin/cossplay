import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@coss-tweak/ui/components/dialog"
import { CodePanel } from "@/components/editor/code-panel"

interface CodePanelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** 代码导出对话框：近全屏（侧栏窄而短），内部滚动。 */
export function CodePanelDialog({ open, onOpenChange }: CodePanelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92dvh] max-w-[min(92vw,560px)] flex-col gap-3">
        <DialogHeader>
          <DialogTitle>主题代码</DialogTitle>
          <DialogDescription>导出当前主题为可直接使用的代码。</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <CodePanel />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CodePanelDialog
