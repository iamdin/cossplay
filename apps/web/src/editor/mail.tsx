import { Badge } from "@cossplay/ui/components/badge"
import { Button } from "@cossplay/ui/components/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@cossplay/ui/components/input-group"
import { Label } from "@cossplay/ui/components/label"
import { Separator } from "@cossplay/ui/components/separator"
import { Switch } from "@cossplay/ui/components/switch"
import { Tabs, TabsList, TabsTab } from "@cossplay/ui/components/tabs"
import { Textarea } from "@cossplay/ui/components/textarea"
import { cn } from "@cossplay/ui/lib/utils"
import {
  ArchiveIcon,
  FileIcon,
  InboxIcon,
  ReplyIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react"
import { Person } from "@/editor/cards"

const folders = [
  ["收件箱", InboxIcon, 128],
  ["草稿", FileIcon, 9],
  ["已发送", SendIcon, 0],
  ["归档", ArchiveIcon, 0],
  ["废纸篓", Trash2Icon, 0],
] as const

const actions = [
  ["归档", ArchiveIcon],
  ["移到废纸篓", Trash2Icon],
  ["回复", ReplyIcon],
] as const

const mails = [
  {
    from: "王明",
    subject: "明天开会",
    preview: "你好，明天开个会讨论这个项目吧。我看过细节，有一些想法。",
    time: "09:34",
    labels: ["会议", "工作"],
    unread: true,
  },
  {
    from: "李安",
    subject: "回复：项目进展",
    preview: "谢谢项目进展。看起来很好！我看完了报告，进度很不错。",
    time: "昨天",
    labels: ["工作"],
    unread: true,
  },
  {
    from: "赵博",
    subject: "周末安排",
    preview: "周末有安排吗？我想去附近的山里走走。",
    time: "2 天前",
    labels: ["私人"],
    unread: false,
  },
  {
    from: "孙雨",
    subject: "回复：关于预算的问题",
    preview: "我对接下来这个项目的预算有个问题。看起来有一处对不上。",
    time: "1 周前",
    labels: ["预算", "工作"],
    unread: false,
  },
]

// 类似 shadcn mail 示例的邮件客户端：文件夹、列表和打开的信。
export function Mail() {
  const open = mails[0]
  return (
    <div className="flex h-full min-h-[36rem] divide-x">
      <nav className="@4xl:flex hidden w-44 shrink-0 flex-col gap-1 p-3">
        {folders.map(([label, Icon, count], i) => (
          <Button
            key={label}
            variant={i === 0 ? "secondary" : "ghost"}
            className="justify-start"
          >
            <Icon />
            {label}
            {count > 0 && (
              <span className="ml-auto text-xs opacity-70">{count}</span>
            )}
          </Button>
        ))}
      </nav>
      <section className="flex @2xl:w-96 w-full min-w-0 @2xl:shrink-0 flex-col gap-3 p-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">收件箱</h2>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTab value="all">全部</TabsTab>
              <TabsTab value="unread">未读</TabsTab>
            </TabsList>
          </Tabs>
        </div>
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput aria-label="搜索邮件" placeholder="搜索" />
        </InputGroup>
        {mails.map((mail) => (
          <button
            key={mail.subject}
            type="button"
            className={cn(
              "flex flex-col gap-1.5 rounded-lg border p-3 text-left text-sm hover:bg-accent",
              mail === open && "bg-muted"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="font-semibold">{mail.from}</span>
              {mail.unread && <span className="size-2 rounded-full bg-info" />}
              <span className="ml-auto text-muted-foreground text-xs">
                {mail.time}
              </span>
            </span>
            <span className="font-medium text-xs">{mail.subject}</span>
            <span className="line-clamp-2 text-muted-foreground text-xs">
              {mail.preview}
            </span>
            <span className="flex gap-1">
              {mail.labels.map((label) => (
                <Badge
                  key={label}
                  variant={label === "工作" ? "default" : "secondary"}
                >
                  {label}
                </Badge>
              ))}
            </span>
          </button>
        ))}
      </section>
      <article className="@2xl:flex hidden min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1 p-2">
          {actions.map(([label, Icon]) => (
            <Button key={label} variant="ghost" size="icon" aria-label={label}>
              <Icon />
            </Button>
          ))}
        </div>
        <Separator />
        <div className="flex items-start justify-between gap-4 p-4">
          <Person
            name={open.from}
            detail={`${open.subject} · 回复至：williamsmith@example.com`}
          />
          <span className="shrink-0 text-muted-foreground text-xs">
            2026 年 10 月 22 日 9:00
          </span>
        </div>
        <Separator />
        <div className="flex-1 space-y-4 whitespace-pre-wrap p-4 text-sm">
          {open.preview}
          {"\n\n请带着问题和想法来。期待见面！\n\n王明"}
        </div>
        <Separator />
        <form className="flex flex-col gap-3 p-4">
          <Textarea placeholder={`回复 ${open.from}…`} />
          <div className="flex items-center">
            <Label className="font-normal text-xs">
              <Switch aria-label="静音此会话" /> 静音此会话
            </Label>
            <Button size="sm" className="ml-auto">
              发送
            </Button>
          </div>
        </form>
      </article>
    </div>
  )
}
