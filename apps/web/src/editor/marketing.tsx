import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@cossplay/ui/components/accordion"
import { Badge } from "@cossplay/ui/components/badge"
import { Button } from "@cossplay/ui/components/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@cossplay/ui/components/card"
import { Input } from "@cossplay/ui/components/input"
import { cn } from "@cossplay/ui/lib/utils"
import {
  ArrowRightIcon,
  CheckIcon,
  GaugeIcon,
  LockIcon,
  PaletteIcon,
  PlugIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react"
import { Person } from "@/editor/cards"

const logos = ["北风", "环球", "因泰", "保护伞", "胡力", "素伦"]

const features = [
  [GaugeIcon, "默认就快", "页面保持精简，一眨眼就加载完。"],
  [PaletteIcon, "可换主题", "每种颜色、字体和圆角都是 token。"],
  [LockIcon, "安全", "SSO、审计日志和基于角色的访问。"],
  [PlugIcon, "集成", "接上团队已经在用的工具。"],
  [UsersIcon, "协作", "一起评论、审阅和发布。"],
  [SparklesIcon, "好用", "每次交互都有用心的细节。"],
] as const

const plans = [
  {
    name: "爱好",
    price: "$0",
    text: "给业余项目。",
    perks: ["1 个项目", "社区支持", "基础分析"],
  },
  {
    name: "专业",
    price: "$29",
    text: "给成长中的团队。",
    perks: ["不限项目", "优先支持", "高级分析"],
    featured: true,
  },
  {
    name: "企业",
    price: "定制",
    text: "给大型组织。",
    perks: ["SSO 与 SCIM", "专属经理", "99.99% 可用性 SLA"],
  },
]

const quotes = [
  [
    "朴丽娜",
    "环球 技术负责人",
    "我们用 Acme 换掉了三个工具，发布节奏翻了一倍。",
  ],
  ["马库斯", "胡力 创始人", "光是换主题，就给设计团队省了好几周。"],
]

const faqs = [
  ["以后能改方案吗？", "可以，随时升级或降级。"],
  ["有免费试用吗？", "专业版带 14 天免费试用。"],
  ["有折扣吗？", "初创公司和非营利组织五折。"],
]

const heading = "font-heading font-semibold text-3xl tracking-tight"

// 落地页：主视觉、标志、功能、定价、评价、常见问题和页脚。
export function Marketing() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-20 px-6 pt-12 pb-6">
      <section className="flex flex-col items-center gap-5 text-center">
        <Badge variant="outline">
          <SparklesIcon />
          新功能：每个团队一套主题
        </Badge>
        <h1 className="max-w-2xl font-heading font-semibold text-5xl tracking-tight">
          做出客户喜欢的产品
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Acme 给团队一个地方来规划、构建和发布，组件看起来就是你的品牌。
        </p>
        <div className="flex gap-2">
          <Button size="lg">
            开始使用
            <ArrowRightIcon />
          </Button>
          <Button size="lg" variant="outline">
            预约演示
          </Button>
        </div>
      </section>

      <section className="flex flex-col items-center gap-4">
        <p className="text-muted-foreground text-sm">这些团队在用</p>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 font-semibold text-lg text-muted-foreground/80">
          {logos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="text-center">
          <h2 className={heading}>你需要的都在</h2>
          <p className="text-muted-foreground">一套会跟着你长大的工具。</p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
          {features.map(([Icon, title, text]) => (
            <div key={title} className="flex flex-col gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4" />
              </span>
              <h3 className="font-medium">{title}</h3>
              <p className="text-muted-foreground text-sm">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <h2 className={cn(heading, "text-center")}>简单定价</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(plan.featured && "border-primary")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.name}
                  {plan.featured && <Badge>热门</Badge>}
                </CardTitle>
                <CardDescription>{plan.text}</CardDescription>
              </CardHeader>
              <CardPanel className="flex flex-col gap-4">
                <p className="font-semibold text-3xl">
                  {plan.price}
                  {plan.price.startsWith("$") && (
                    <span className="font-normal text-muted-foreground text-sm">
                      /月
                    </span>
                  )}
                </p>
                <ul className="flex flex-col gap-2 text-sm">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2">
                      <CheckIcon className="size-4 text-primary" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </CardPanel>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.featured ? "default" : "outline"}
                >
                  选择{plan.name}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-4">
        {quotes.map(([name, role, quote]) => (
          <figure
            key={name}
            className="flex flex-col gap-4 rounded-xl bg-muted p-6"
          >
            <blockquote className="text-lg">“{quote}”</blockquote>
            <Person name={name} detail={role} />
          </figure>
        ))}
      </section>

      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h2 className={cn(heading, "text-center")}>常见问题</h2>
        <Accordion>
          {faqs.map(([question, answer]) => (
            <AccordionItem key={question} value={question}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionPanel>{answer}</AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground">
        <h2 className={heading}>准备开始了吗？</h2>
        <p className="opacity-80">加入 10,000+ 个用 Acme 发布的团队。</p>
        <form className="flex w-full max-w-sm gap-2">
          <Input
            aria-label="邮箱"
            placeholder="you@example.com"
            className="bg-background text-foreground"
          />
          <Button variant="secondary">订阅</Button>
        </form>
      </section>

      <footer className="flex flex-wrap justify-between gap-4 border-t pt-6 text-muted-foreground text-sm">
        <span>© 2026 Acme 公司</span>
        <nav className="flex gap-4">
          {["隐私", "条款", "联系"].map((link) => (
            <a key={link} href="#marketing" className="hover:text-foreground">
              {link}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  )
}
