import { Badge } from "@cossplay/ui/components/badge"
import { Button } from "@cossplay/ui/components/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFrame,
  CardFrameAction,
  CardFrameHeader,
  CardFrameTitle,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@cossplay/ui/components/card"
import { Kbd } from "@cossplay/ui/components/kbd"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cossplay/ui/components/table"
import { Tabs, TabsList, TabsTab } from "@cossplay/ui/components/tabs"
import { Textarea } from "@cossplay/ui/components/textarea"
import { cn } from "@cossplay/ui/lib/utils"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  HeartIcon,
  MessageCircleIcon,
  Repeat2Icon,
} from "lucide-react"
import ChatInput from "@/components/particles/p-input-group-29"
import { Person } from "@/editor/cards"

const posts = [
  [
    "陈玛雅",
    "@maya · 12 分钟",
    "今天上了深色模式。每个组件的颜色都从 token 读，一个下午就做完了。",
    24,
    5,
  ],
  [
    "利奥",
    "@leo · 1 小时",
    "说一句：一个好的空状态，比花哨的引导流程更值钱。",
    86,
    17,
  ],
] as const

const threads = [
  ["汤艾娃", "好，三点见！", true],
  ["加西亚", "发票已经发过去了。", false],
  ["罗米娅", "能看一下我的 PR 吗？", false],
] as const

const transactions = [
  ["Stripe 入账", "10 月 6 日", "+$2,450.00", "已完成"],
  ["Figma", "10 月 5 日", "-$45.00", "已完成"],
  ["AWS", "10 月 4 日", "-$318.24", "处理中"],
  ["客户退款", "10 月 2 日", "-$120.00", "失败"],
  ["发票 #1042", "10 月 1 日", "+$980.00", "已完成"],
] as const

const status = {
  已完成: "success",
  处理中: "warning",
  失败: "error",
} as const

// 应用画面：动态、消息和交易。
export function Application() {
  return (
    <div className="grid @4xl:grid-cols-2 gap-4 px-4 pt-2 pb-6">
      <Card>
        <CardHeader>
          <CardTitle>动态</CardTitle>
          <CardAction>
            <Tabs defaultValue="for-you">
              <TabsList>
                <TabsTab value="for-you">为你推荐</TabsTab>
                <TabsTab value="following">关注</TabsTab>
              </TabsList>
            </Tabs>
          </CardAction>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <Textarea placeholder="有什么新鲜事？" />
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>
                <Kbd>⌘</Kbd> <Kbd>Enter</Kbd> 发布
              </span>
              <Button size="sm">发布</Button>
            </div>
          </div>
          {posts.map(([name, handle, text, likes, replies]) => (
            <article
              key={name}
              className="flex flex-col gap-2 border-t pt-4 text-sm"
            >
              <Person name={name} detail={handle} />
              <p>{text}</p>
              <div className="flex gap-1 text-muted-foreground">
                <Button variant="ghost" size="xs">
                  <MessageCircleIcon />
                  {replies}
                </Button>
                <Button variant="ghost" size="xs">
                  <Repeat2Icon />
                  转发
                </Button>
                <Button variant="ghost" size="xs">
                  <HeartIcon />
                  {likes}
                </Button>
              </div>
            </article>
          ))}
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>消息</CardTitle>
          <CardDescription>3 个会话</CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            {threads.map(([name, last, active]) => (
              <div
                key={name}
                className={cn(
                  "flex items-center gap-2 rounded-lg p-2",
                  active && "bg-muted"
                )}
              >
                <Person name={name} detail={last} className="flex-1" />
                {active && <Badge>2</Badge>}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 text-sm">
            <p className="w-max max-w-[75%] rounded-lg bg-background px-3 py-2">
              设计评审还是那个时间吗？
            </p>
            <p className="ml-auto w-max max-w-[75%] rounded-lg bg-primary px-3 py-2 text-primary-foreground">
              是的！我会带上新主题。
            </p>
            <p className="w-max max-w-[75%] rounded-lg bg-background px-3 py-2">
              好，三点见！
            </p>
          </div>
          <ChatInput />
        </CardPanel>
      </Card>

      <CardFrame className="@4xl:col-span-2 min-w-0">
        <CardFrameHeader>
          <CardFrameTitle>交易</CardFrameTitle>
          <CardFrameAction>
            <Button variant="outline" size="sm">
              导出
            </Button>
          </CardFrameAction>
        </CardFrameHeader>
        <Table variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>说明</TableHead>
              <TableHead>日期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">金额</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(([name, date, amount, state]) => {
              const income = amount.startsWith("+")
              const Icon = income ? ArrowDownLeftIcon : ArrowUpRightIcon
              return (
                <TableRow key={name}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          "size-4",
                          income
                            ? "text-success-foreground"
                            : "text-muted-foreground"
                        )}
                      />
                      {name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {date}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status[state]}>{state}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {amount}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardFrame>
    </div>
  )
}
