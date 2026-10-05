import { Button } from "@coss-tweak/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@coss-tweak/ui/components/dialog"
import { Input } from "@coss-tweak/ui/components/input"
import { ScrollArea } from "@coss-tweak/ui/components/scroll-area"
import { Check, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  applyOverrides,
  themeOp,
  useSiteStore,
  useTheme,
} from "@/store/site-store"

interface LocalThemesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** 本地主题：保存当前完整主题，跨网站复用；应用后写入当前网站并可撤销。 */
export function LocalThemesDialog({
  open,
  onOpenChange,
}: LocalThemesDialogProps) {
  const theme = useTheme()
  const locals = useSiteStore((s) => s.locals)
  const [name, setName] = useState("")
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(
    null
  )

  const save = () => {
    if (!theme || !name.trim()) return
    themeOp({ kind: "add", name, theme })
    setName("")
  }
  const rename = () => {
    if (editing?.name.trim())
      themeOp({ kind: "rename", id: editing.id, name: editing.name })
    setEditing(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] max-w-[min(92vw,560px)] flex-col gap-3">
        <DialogHeader>
          <DialogTitle>本地主题</DialogTitle>
          <DialogDescription>
            保存在本扩展中，可应用到任意网站。
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <Input
            aria-label="主题名称"
            placeholder="为当前主题命名"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={!theme || !name.trim()}>
            保存当前主题
          </Button>
        </form>

        <ScrollArea className="min-h-0 flex-1">
          {locals.length === 0 && (
            <p className="py-6 text-center text-muted-foreground text-xs">
              还没有本地主题
            </p>
          )}
          <ul className="space-y-1.5 pr-2">
            {locals.map((local) => (
              <li
                key={local.id}
                className="flex items-center gap-1.5 rounded-md border p-1.5"
              >
                <span
                  className="size-5 shrink-0 rounded border"
                  style={{ background: local.theme.light.primary }}
                />
                {editing?.id === local.id ? (
                  <Input
                    autoFocus
                    aria-label="新名称"
                    className="h-7"
                    maxLength={100}
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ id: local.id, name: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") rename()
                      if (e.key === "Escape") setEditing(null)
                    }}
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate text-xs">
                    {local.name}
                  </span>
                )}
                {editing?.id === local.id ? (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="确认重命名"
                    onClick={rename}
                  >
                    <Check />
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        applyOverrides(structuredClone(local.theme), local.id)
                        onOpenChange(false)
                      }}
                    >
                      应用
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`重命名 ${local.name}`}
                      onClick={() =>
                        setEditing({ id: local.id, name: local.name })
                      }
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`删除 ${local.name}`}
                      onClick={() => {
                        if (confirm(`删除本地主题「${local.name}」？`))
                          themeOp({ kind: "delete", id: local.id })
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default LocalThemesDialog
