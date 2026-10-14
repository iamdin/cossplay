import { Avatar, AvatarFallback } from "@cossplay/ui/components/avatar"
import { Badge } from "@cossplay/ui/components/badge"
import { Button } from "@cossplay/ui/components/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@cossplay/ui/components/card"
import { Field, FieldLabel } from "@cossplay/ui/components/field"
import { Input } from "@cossplay/ui/components/input"
import { Label } from "@cossplay/ui/components/label"
import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@cossplay/ui/components/meter"
import { Radio, RadioGroup } from "@cossplay/ui/components/radio-group"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@cossplay/ui/components/select"
import { Separator } from "@cossplay/ui/components/separator"
import { Switch } from "@cossplay/ui/components/switch"
import { Textarea } from "@cossplay/ui/components/textarea"
import { cn } from "@cossplay/ui/lib/utils"
import {
  CreditCardIcon,
  GithubIcon,
  LandmarkIcon,
  MailIcon,
  WalletIcon,
} from "lucide-react"
import EmptyProjects from "@/components/particles/p-card-11"
import ChatInput from "@/components/particles/p-input-group-29"
import Verify from "@/components/particles/p-otp-field-4"

/** 普通字符串选项上的 coss ui Select；第一项是默认值。 */
export function Choice({ label, items }: { label: string; items: string[] }) {
  return (
    <Select
      aria-label={label}
      defaultValue={items[0]}
      items={items.map((value) => ({ label: value, value }))}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {items.map((value) => (
          <SelectItem key={value} value={value}>
            {value}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

export function Person({
  name,
  detail,
  className,
}: {
  name: string
  detail: string
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Avatar>
        <AvatarFallback>
          {name
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-sm">{name}</p>
        <p className="truncate text-muted-foreground text-xs">{detail}</p>
      </div>
    </div>
  )
}

const stats = [
  ["总收入", "$15,231.89", "较上月 +20.1%", "success"],
  ["订阅", "+2,350", "较上月 +180.1%", "success"],
  ["流失", "2.4%", "较上月 +0.6%", "error"],
] as const

const team = [
  ["林晓", "sofia@example.com", "所有者"],
  ["陈远", "jackson@example.com", "开发"],
  ["阮安", "bella@example.com", "账单"],
]

const messages = [
  ["them", "你好，今天需要什么帮助？"],
  ["me", "嗨，我的账户出了点问题。"],
  ["them", "具体是什么情况？"],
  ["me", "我登不进去。"],
]

const notifications = [
  ["你的通话已确认。", "1 小时前", true],
  ["你有一条新消息！", "1 小时前", true],
  ["你的订阅即将到期！", "2 小时前", false],
] as const

const methods = [
  ["card", "银行卡", CreditCardIcon],
  ["paypal", "PayPal", WalletIcon],
  ["bank", "银行", LandmarkIcon],
] as const

const cookies = [
  ["严格必要", "网站运行所必需。", true],
  ["功能", "记住你的偏好。", false],
  ["性能", "帮助我们改进网站。", false],
] as const

const storage = [
  ["文档", 42],
  ["照片", 27],
  ["备份", 13],
] as const

// 类似 shadcn cards 示例的卡片，按列砌成瀑布流。
export function Cards() {
  return (
    <div className="columns-[19rem] gap-4 px-4 pt-2 pb-6 *:mb-4 *:break-inside-avoid">
      {stats.map(([title, value, change, tone]) => (
        <Card key={title}>
          <CardHeader>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-2xl">{value}</CardTitle>
            <CardAction>
              <Badge variant={tone}>{change.split(" ")[0]}</Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="text-muted-foreground text-xs">
            {change}
          </CardFooter>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>创建账户</CardTitle>
          <CardDescription>在下面填写邮箱以创建账户。</CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline">
              <GithubIcon />
              GitHub
            </Button>
            <Button variant="outline">
              <MailIcon />
              Google
            </Button>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase">
            <Separator className="flex-1" />
            或继续使用
            <Separator className="flex-1" />
          </div>
          <Field>
            <FieldLabel>邮箱</FieldLabel>
            <Input type="email" placeholder="m@example.com" />
          </Field>
          <Field>
            <FieldLabel>密码</FieldLabel>
            <Input type="password" />
          </Field>
          <Button className="w-full">创建账户</Button>
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>团队成员</CardTitle>
          <CardDescription>邀请团队一起协作。</CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4">
          {team.map(([name, email, role]) => (
            <div key={name} className="flex items-center justify-between gap-3">
              <Person name={name} detail={email} />
              <div className="w-32 shrink-0">
                <Choice
                  label={`${name}的角色`}
                  items={[role, "查看者", "管理员"]}
                />
              </div>
            </div>
          ))}
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>支付方式</CardTitle>
          <CardDescription>为账户添加一种新的支付方式。</CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4">
          <RadioGroup defaultValue="card" className="grid grid-cols-3 gap-2">
            {methods.map(([value, label, Icon]) => (
              <Label
                key={value}
                className="flex flex-col items-center gap-2 rounded-lg border p-3 has-data-checked:border-primary"
              >
                <Radio value={value} className="sr-only" />
                <Icon className="size-5" />
                {label}
              </Label>
            ))}
          </RadioGroup>
          <Field>
            <FieldLabel>姓名</FieldLabel>
            <Input placeholder="姓 名" />
          </Field>
          <Field>
            <FieldLabel>卡号</FieldLabel>
            <Input placeholder="4242 4242 4242 4242" />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Choice label="月" items={["一月", "二月", "三月"]} />
            <Choice label="年" items={["2027", "2028", "2029"]} />
            <Input aria-label="安全码" placeholder="安全码" />
          </div>
        </CardPanel>
        <CardFooter>
          <Button className="w-full">继续</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>聊天</CardTitle>
          <CardAction>
            <Badge variant="success">在线</Badge>
          </CardAction>
        </CardHeader>
        <CardPanel className="flex flex-col gap-3">
          {messages.map(([from, text]) => (
            <p
              key={text}
              className={cn(
                "w-max max-w-[75%] rounded-lg px-3 py-2 text-sm",
                from === "me"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {text}
            </p>
          ))}
          <ChatInput />
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>报告问题</CardTitle>
          <CardDescription>你在哪一块遇到了问题？</CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Field>
              <FieldLabel>范围</FieldLabel>
              <Choice label="范围" items={["账单", "账户", "安全"]} />
            </Field>
            <Field>
              <FieldLabel>严重程度</FieldLabel>
              <Choice label="严重程度" items={["中", "低", "高"]} />
            </Field>
          </div>
          <Field>
            <FieldLabel>主题</FieldLabel>
            <Input placeholder="我需要帮助…" />
          </Field>
          <Field>
            <FieldLabel>描述</FieldLabel>
            <Textarea placeholder="请写上所有相关信息。" />
          </Field>
        </CardPanel>
        <CardFooter className="justify-between">
          <Button variant="ghost">取消</Button>
          <Button>提交</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>通知</CardTitle>
          <CardDescription>你有 3 条未读消息。</CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4">
          <Label className="justify-between rounded-lg border p-3">
            <span>
              推送通知
              <span className="block font-normal text-muted-foreground text-xs">
                把通知发到设备。
              </span>
            </span>
            <Switch defaultChecked />
          </Label>
          {notifications.map(([title, time, unread]) => (
            <div key={title} className="flex gap-3">
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  unread ? "bg-info" : "bg-muted"
                )}
              />
              <div>
                <p className="font-medium text-sm">{title}</p>
                <p className="text-muted-foreground text-xs">{time}</p>
              </div>
            </div>
          ))}
        </CardPanel>
        <CardFooter>
          <Button variant="secondary" className="w-full">
            全部标为已读
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cookie 设置</CardTitle>
          <CardDescription>在这里管理 Cookie 设置。</CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4">
          {cookies.map(([title, text, on]) => (
            <Label key={title} className="justify-between">
              <span>
                {title}
                <span className="block font-normal text-muted-foreground text-xs">
                  {text}
                </span>
              </span>
              <Switch defaultChecked={on} />
            </Label>
          ))}
        </CardPanel>
        <CardFooter>
          <Button variant="outline" className="w-full">
            保存偏好
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>存储</CardTitle>
          <CardDescription>你的方案包含 100 GB。</CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4">
          {storage.map(([label, value]) => (
            <Meter key={label} value={value}>
              <div className="flex justify-between gap-2">
                <MeterLabel>{label}</MeterLabel>
                <MeterValue>{(_, v) => `${v} GB`}</MeterValue>
              </div>
              <MeterTrack>
                <MeterIndicator />
              </MeterTrack>
            </Meter>
          ))}
        </CardPanel>
        <CardFooter>
          <Button className="w-full">升级方案</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>两步验证</CardTitle>
          <CardDescription>确认是你本人后再继续。</CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col items-center gap-4">
          <Verify />
          <Button className="w-full">验证</Button>
        </CardPanel>
      </Card>

      <EmptyProjects />
    </div>
  )
}
