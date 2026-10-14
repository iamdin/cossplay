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
  ["仪表盘", HomeIcon],
  ["收件箱", InboxIcon],
  ["项目", FolderIcon],
  ["报告", BarChart3Icon],
  ["团队", UsersIcon],
  ["设置", SettingsIcon],
] as const

const stats = [
  ["收入", "$45,231", "+20.1%", "success"],
  ["新客户", "1,234", "-4.3%", "error"],
  ["活跃账户", "45,678", "+12.5%", "success"],
  ["增长率", "4.5%", "+0.4%", "info"],
] as const

const tone = {
  完成: "success",
  进行中: "info",
  审阅: "warning",
  受阻: "error",
} as const

const rows: [string, string, keyof typeof tone, string][] = [
  ["封面", "设计", "完成", "埃迪"],
  ["目录", "内容", "进行中", "贾米克"],
  ["摘要", "内容", "审阅", "埃迪"],
  ["技术方案", "工程", "受阻", "艾米莉"],
  ["风险管理", "规划", "进行中", "贾米克"],
  ["定价", "财务", "完成", "艾米莉"],
]

const activity = [
  ["林晓", "通过了定价一节", "2 分钟"],
  ["陈远", "评论了封面", "1 小时"],
  ["阮安", "把风险管理移到审阅", "3 小时"],
  ["金伟", "邀请了两位新成员", "1 天"],
]

// 应用仪表盘（侧栏、顶栏、统计、表格、动态），不含图表。
export function Dashboard() {
  return (
    <div className="flex min-h-full">
      <aside className="@2xl:flex hidden w-52 shrink-0 flex-col gap-1 border-sidebar-border border-r bg-sidebar p-3 text-sidebar-foreground">
        <div className="mb-3 flex items-center gap-2 px-2 font-semibold text-sm">
          <span className="grid size-6 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-xs">
            A
          </span>
          Acme 公司
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
          name="沙德"
          detail="m@example.com"
          className="mt-auto rounded-md border border-sidebar-border p-2"
        />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <h1 className="mr-auto font-semibold">文档</h1>
          <InputGroup className="@lg:flex hidden w-48">
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput aria-label="搜索" placeholder="搜索…" />
          </InputGroup>
          <Button>
            <PlusIcon />
            快速创建
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
                <CardFrameTitle>大纲</CardFrameTitle>
                <CardFrameDescription>
                  提案的各节以及负责人。
                </CardFrameDescription>
                <CardFrameAction>
                  <Button variant="outline" size="sm">
                    自定义列
                  </Button>
                </CardFrameAction>
              </CardFrameHeader>
              <Table variant="card">
                <TableHeader>
                  <TableRow>
                    <TableHead>章节</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>审阅人</TableHead>
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
                <CardTitle>最近动态</CardTitle>
                <CardDescription>团队今天做了什么。</CardDescription>
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
