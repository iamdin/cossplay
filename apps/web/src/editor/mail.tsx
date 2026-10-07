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
  ["Inbox", InboxIcon, 128],
  ["Drafts", FileIcon, 9],
  ["Sent", SendIcon, 0],
  ["Archive", ArchiveIcon, 0],
  ["Trash", Trash2Icon, 0],
] as const

const actions = [
  ["Archive", ArchiveIcon],
  ["Move to trash", Trash2Icon],
  ["Reply", ReplyIcon],
] as const

const mails = [
  {
    from: "William Smith",
    subject: "Meeting tomorrow",
    preview:
      "Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the details and have some ideas.",
    time: "09:34",
    labels: ["meeting", "work"],
    unread: true,
  },
  {
    from: "Alice Smith",
    subject: "Re: Project update",
    preview:
      "Thank you for the project update. It looks great! I've gone through the report and the progress is impressive.",
    time: "Yesterday",
    labels: ["work"],
    unread: true,
  },
  {
    from: "Bob Johnson",
    subject: "Weekend plans",
    preview:
      "Any plans for the weekend? I was thinking of going hiking in the nearby mountains.",
    time: "2 days ago",
    labels: ["personal"],
    unread: false,
  },
  {
    from: "Emily Davis",
    subject: "Re: Question about budget",
    preview:
      "I have a question about the budget for the upcoming project. It seems there's a discrepancy.",
    time: "1 week ago",
    labels: ["budget", "work"],
    unread: false,
  },
]

// A mail client like shadcn's mail example: folders, message list and the open message.
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
          <h2 className="font-semibold text-lg">Inbox</h2>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTab value="all">All mail</TabsTab>
              <TabsTab value="unread">Unread</TabsTab>
            </TabsList>
          </Tabs>
        </div>
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput aria-label="Search mail" placeholder="Search" />
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
                  variant={label === "work" ? "default" : "secondary"}
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
            detail={`${open.subject} · Reply-To: williamsmith@example.com`}
          />
          <span className="shrink-0 text-muted-foreground text-xs">
            Oct 22, 2026, 9:00 AM
          </span>
        </div>
        <Separator />
        <div className="flex-1 space-y-4 whitespace-pre-wrap p-4 text-sm">
          {open.preview}
          {
            "\n\nPlease come prepared with any questions or insights you may have. Looking forward to our meeting!\n\nBest regards, William"
          }
        </div>
        <Separator />
        <form className="flex flex-col gap-3 p-4">
          <Textarea placeholder={`Reply ${open.from}…`} />
          <div className="flex items-center">
            <Label className="font-normal text-xs">
              <Switch aria-label="Mute this thread" /> Mute this thread
            </Label>
            <Button size="sm" className="ml-auto">
              Send
            </Button>
          </div>
        </form>
      </article>
    </div>
  )
}
