import { Badge } from "@cossplay/ui/components/badge"
import { Button } from "@cossplay/ui/components/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@cossplay/ui/components/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@cossplay/ui/components/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cossplay/ui/components/table"
import { cn } from "@cossplay/ui/lib/utils"
import {
  BarChart3Icon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"
import { Person } from "@/editor/cards"

const nav = [
  ["Dashboard", HomeIcon],
  ["Inbox", InboxIcon],
  ["Projects", FolderIcon],
  ["Reports", BarChart3Icon],
  ["Team", UsersIcon],
  ["Settings", SettingsIcon],
] as const

const stats = [
  ["Revenue", "$45,231", "+20.1%", "success"],
  ["New customers", "1,234", "-4.3%", "error"],
  ["Active accounts", "45,678", "+12.5%", "success"],
  ["Growth rate", "4.5%", "+0.4%", "info"],
] as const

const tone = {
  Done: "success",
  "In progress": "info",
  Review: "warning",
  Blocked: "error",
} as const

const rows: [string, string, keyof typeof tone, string][] = [
  ["Cover page", "Design", "Done", "Eddie Lake"],
  ["Table of contents", "Content", "In progress", "Jamik Tashpulatov"],
  ["Executive summary", "Content", "Review", "Eddie Lake"],
  ["Technical approach", "Engineering", "Blocked", "Emily Whalen"],
  ["Risk management", "Planning", "In progress", "Jamik Tashpulatov"],
  ["Pricing", "Finance", "Done", "Emily Whalen"],
]

const activity = [
  ["Olivia Martin", "Approved the pricing section", "2m"],
  ["Jackson Lee", "Commented on the cover page", "1h"],
  ["Isabella Nguyen", "Moved risk management to review", "3h"],
  ["William Kim", "Invited two new members", "1d"],
]

// An app dashboard (sidebar, header, stats, table, activity) without charts.
export function Dashboard() {
  return (
    <div className="flex min-h-full">
      <aside className="@2xl:flex hidden w-52 shrink-0 flex-col gap-1 border-sidebar-border border-r bg-sidebar p-3 text-sidebar-foreground">
        <div className="mb-3 flex items-center gap-2 px-2 font-semibold text-sm">
          <span className="grid size-6 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-xs">
            A
          </span>
          Acme Inc.
        </div>
        {nav.map(([label, Icon], i) => (
          <a
            key={label}
            href="#dashboard"
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              i === 0 &&
                "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </a>
        ))}
        <Person
          name="Shad CN"
          detail="m@example.com"
          className="mt-auto rounded-md border border-sidebar-border p-2"
        />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <h1 className="mr-auto font-semibold">Documents</h1>
          <InputGroup className="@lg:flex hidden w-48">
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput aria-label="Search" placeholder="Search…" />
          </InputGroup>
          <Button>
            <PlusIcon />
            Quick create
          </Button>
        </header>
        <div className="flex flex-col gap-4 p-4">
          <div className="grid @4xl:grid-cols-4 grid-cols-2 gap-4">
            {stats.map(([title, value, change, badge]) => (
              <Card key={title}>
                <CardHeader>
                  <CardDescription>{title}</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">
                    {value}
                  </CardTitle>
                  <CardAction>
                    <Badge variant={badge}>{change}</Badge>
                  </CardAction>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="grid @5xl:grid-cols-[1fr_20rem] gap-4">
            <CardFrame className="min-w-0">
              <CardFrameHeader>
                <CardFrameTitle>Outline</CardFrameTitle>
                <CardFrameDescription>
                  Sections of the proposal and who owns them.
                </CardFrameDescription>
                <CardFrameAction>
                  <Button variant="outline" size="sm">
                    Customize columns
                  </Button>
                </CardFrameAction>
              </CardFrameHeader>
              <Table variant="card">
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(([section, type, status, reviewer]) => (
                    <TableRow key={section}>
                      <TableCell className="font-medium">{section}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tone[status]}>{status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {reviewer}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardFrame>
            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>What your team did today.</CardDescription>
              </CardHeader>
              <CardPanel className="flex flex-col gap-4">
                {activity.map(([name, action, time]) => (
                  <div key={name} className="flex items-start gap-2">
                    <Person name={name} detail={action} className="flex-1" />
                    <span className="text-muted-foreground text-xs">
                      {time}
                    </span>
                  </div>
                ))}
              </CardPanel>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
