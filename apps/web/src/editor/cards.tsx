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

/** A coss ui Select over plain string options; the first is the default. */
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
  ["Total revenue", "$15,231.89", "+20.1% from last month", "success"],
  ["Subscriptions", "+2,350", "+180.1% from last month", "success"],
  ["Churn", "2.4%", "+0.6% from last month", "error"],
] as const

const team = [
  ["Sofia Davis", "sofia@example.com", "Owner"],
  ["Jackson Lee", "jackson@example.com", "Developer"],
  ["Isabella Nguyen", "bella@example.com", "Billing"],
]

const messages = [
  ["them", "Hi, how can I help you today?"],
  ["me", "Hey, I'm having trouble with my account."],
  ["them", "What seems to be the problem?"],
  ["me", "I can't log in."],
]

const notifications = [
  ["Your call has been confirmed.", "1 hour ago", true],
  ["You have a new message!", "1 hour ago", true],
  ["Your subscription is expiring soon!", "2 hours ago", false],
] as const

const methods = [
  ["card", "Card", CreditCardIcon],
  ["paypal", "PayPal", WalletIcon],
  ["bank", "Bank", LandmarkIcon],
] as const

const cookies = [
  ["Strictly necessary", "Essential for the site to work.", true],
  ["Functional", "Remember your preferences.", false],
  ["Performance", "Help us improve the site.", false],
] as const

const storage = [
  ["Documents", 42],
  ["Photos", 27],
  ["Backups", 13],
] as const

// Realistic cards like shadcn's cards example, laid out as a masonry of columns.
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
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your email below to create your account.
          </CardDescription>
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
            Or continue with
            <Separator className="flex-1" />
          </div>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" placeholder="m@example.com" />
          </Field>
          <Field>
            <FieldLabel>Password</FieldLabel>
            <Input type="password" />
          </Field>
          <Button className="w-full">Create account</Button>
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>Invite your team to collaborate.</CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4">
          {team.map(([name, email, role]) => (
            <div key={name} className="flex items-center justify-between gap-3">
              <Person name={name} detail={email} />
              <div className="w-32 shrink-0">
                <Choice
                  label={`${name}'s role`}
                  items={[role, "Viewer", "Admin"]}
                />
              </div>
            </div>
          ))}
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment method</CardTitle>
          <CardDescription>
            Add a new payment method to your account.
          </CardDescription>
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
            <FieldLabel>Name</FieldLabel>
            <Input placeholder="First Last" />
          </Field>
          <Field>
            <FieldLabel>Card number</FieldLabel>
            <Input placeholder="4242 4242 4242 4242" />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Choice label="Month" items={["January", "February", "March"]} />
            <Choice label="Year" items={["2027", "2028", "2029"]} />
            <Input aria-label="CVC" placeholder="CVC" />
          </div>
        </CardPanel>
        <CardFooter>
          <Button className="w-full">Continue</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chat</CardTitle>
          <CardAction>
            <Badge variant="success">Online</Badge>
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
          <CardTitle>Report an issue</CardTitle>
          <CardDescription>
            What area are you having problems with?
          </CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Field>
              <FieldLabel>Area</FieldLabel>
              <Choice label="Area" items={["Billing", "Account", "Security"]} />
            </Field>
            <Field>
              <FieldLabel>Severity</FieldLabel>
              <Choice label="Severity" items={["Medium", "Low", "High"]} />
            </Field>
          </div>
          <Field>
            <FieldLabel>Subject</FieldLabel>
            <Input placeholder="I need help with…" />
          </Field>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea placeholder="Please include all relevant information." />
          </Field>
        </CardPanel>
        <CardFooter className="justify-between">
          <Button variant="ghost">Cancel</Button>
          <Button>Submit</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>You have 3 unread messages.</CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-4">
          <Label className="justify-between rounded-lg border p-3">
            <span>
              Push notifications
              <span className="block font-normal text-muted-foreground text-xs">
                Send notifications to device.
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
            Mark all as read
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cookie settings</CardTitle>
          <CardDescription>Manage your cookie settings here.</CardDescription>
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
            Save preferences
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
          <CardDescription>Your plan includes 100 GB.</CardDescription>
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
          <Button className="w-full">Upgrade plan</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>Confirm it's you to continue.</CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col items-center gap-4">
          <Verify />
          <Button className="w-full">Verify</Button>
        </CardPanel>
      </Card>

      <EmptyProjects />
    </div>
  )
}
