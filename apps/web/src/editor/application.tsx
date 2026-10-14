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
    "Maya Chen",
    "@maya · 12m",
    "Shipped dark mode today. Every component reads its colors from tokens, so it took one afternoon.",
    24,
    5,
  ],
  [
    "Leo Martins",
    "@leo · 1h",
    "Hot take: a good empty state is worth more than a fancy onboarding tour.",
    86,
    17,
  ],
] as const

const threads = [
  ["Ava Thompson", "Sounds good, see you at 3!", true],
  ["Noah Garcia", "Sent the invoice over.", false],
  ["Mia Robinson", "Can you review my PR?", false],
] as const

const transactions = [
  ["Stripe payout", "Oct 6", "+$2,450.00", "Completed"],
  ["Figma", "Oct 5", "-$45.00", "Completed"],
  ["AWS", "Oct 4", "-$318.24", "Pending"],
  ["Client refund", "Oct 2", "-$120.00", "Failed"],
  ["Invoice #1042", "Oct 1", "+$980.00", "Completed"],
] as const

const status = {
  Completed: "success",
  Pending: "warning",
  Failed: "error",
} as const

// App screens: a social feed, messaging and transactions.
export function Application() {
  return (
    <div className="grid @4xl:grid-cols-2 gap-4 px-4 pt-2 pb-6">
      <Card>
        <CardHeader>
          <CardTitle>Feed</CardTitle>
          <CardAction>
            <Tabs defaultValue="for-you">
              <TabsList>
                <TabsTab value="for-you">For you</TabsTab>
                <TabsTab value="following">Following</TabsTab>
              </TabsList>
            </Tabs>
          </CardAction>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <Textarea placeholder="What's happening?" />
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>
                <Kbd>⌘</Kbd> <Kbd>Enter</Kbd> to post
              </span>
              <Button size="sm">Post</Button>
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
                  Repost
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
          <CardTitle>Messages</CardTitle>
          <CardDescription>3 conversations</CardDescription>
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
              Are we still on for the design review?
            </p>
            <p className="ml-auto w-max max-w-[75%] rounded-lg bg-primary px-3 py-2 text-primary-foreground">
              Yes! I'll bring the new themes.
            </p>
            <p className="w-max max-w-[75%] rounded-lg bg-background px-3 py-2">
              Sounds good, see you at 3!
            </p>
          </div>
          <ChatInput />
        </CardPanel>
      </Card>

      <CardFrame className="@4xl:col-span-2 min-w-0">
        <CardFrameHeader>
          <CardFrameTitle>Transactions</CardFrameTitle>
          <CardFrameAction>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </CardFrameAction>
        </CardFrameHeader>
        <Table variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
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
