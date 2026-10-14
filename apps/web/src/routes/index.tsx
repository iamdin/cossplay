import { Badge } from "@cossplay/ui/components/badge"
import { Button } from "@cossplay/ui/components/button"
import { createFileRoute } from "@tanstack/react-router"
import {
  ArrowRightIcon,
  CheckIcon,
  ChromeIcon,
  CodeIcon,
  ContrastIcon,
  CopyIcon,
  HistoryIcon,
  LockIcon,
  PaletteIcon,
  PanelRightIcon,
  SquareDashedMousePointerIcon,
  TypeIcon,
} from "lucide-react"
import { type ReactNode, useState } from "react"
import { Footer, Logo } from "@/landing/chrome"
import { ThemeDemo } from "@/landing/demo"
import styles from "@/styles/landing.css?url"

const site = "https://cossplay.vercel.app"
const title = "Cossplay：coss ui 的实时主题编辑器"
const description =
  "实时为主题调整 coss ui 应用：42 个 tweakcn 预设，颜色、字体、圆角与对比度检查。可在浏览器中使用，或在你自己的网站上用 Chrome 侧边栏。可导出 Tailwind CSS，或用 shadcn CLI 安装。"

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${site}/` },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: `${site}/og.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: `${site}/og.png` },
    ],
    links: [
      { rel: "canonical", href: `${site}/` },
      { rel: "stylesheet", href: styles },
    ],
  }),
  component: Landing,
})

/** Chrome 网上应用店上架后再填。 */
const chromeStoreUrl = ""

function AddToChrome() {
  return chromeStoreUrl ? (
    <Button
      size="lg"
      variant="outline"
      render={<a href={chromeStoreUrl} target="_blank" rel="noreferrer" />}
    >
      <ChromeIcon />
      添加到 Chrome
    </Button>
  ) : (
    <Button size="lg" variant="outline" disabled>
      <ChromeIcon />
      Chrome 扩展 · 审核中
    </Button>
  )
}

function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  lede: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 py-16 sm:py-24">
      <p className="font-medium text-muted-foreground text-sm">{eyebrow}</p>
      <h2 className="mt-2 max-w-2xl text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
        {lede}
      </p>
      <div className="mt-12">{children}</div>
    </section>
  )
}

const ways = [
  {
    icon: CodeIcon,
    title: "在浏览器里",
    body: "打开 Editor，给真实 coss ui 组件的 Gallery 换主题：卡片、仪表盘、邮件、营销页和应用页。不用安装。",
    action: (
      <a
        href="/editor"
        className="inline-flex items-center gap-1 font-medium text-sm hover:underline"
      >
        打开 Editor <ArrowRightIcon className="size-4" />
      </a>
    ),
  },
  {
    icon: PanelRightIcon,
    title: "在任意 coss ui 站点上",
    body: "Chrome 扩展停在侧边栏，编辑当前页面的主题，localhost 或线上都可以，并按站点记住。",
    action: (
      <span className="font-medium text-muted-foreground text-sm">
        Chrome 网上应用店条目审核中
      </span>
    ),
  },
  {
    icon: PaletteIcon,
    title: "在 Editor 里预览你自己的应用",
    body: "开发时加一个 script 标签，Editor 的「自定义」标签就会在控件旁边实时给你正在运行的应用换主题。",
    action: (
      <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
        {`<script src="${site}/bridge.js">`}
      </code>
    ),
  },
]

const features = [
  {
    icon: PaletteIcon,
    title: "42 个预设，认得 coss",
    body: "全部 tweakcn 预设，加上 coss ui 的默认主题，映射到 info、success、warning、code 这些 coss token。可以搜索、逐个切换或随机。",
  },
  {
    icon: SquareDashedMousePointerIcon,
    title: "指到哪，改到哪",
    body: "指向任意元素，看是哪些 token 在给它上色，点一下就跳到对应控件。",
  },
  {
    icon: CodeIcon,
    title: "精确改色",
    body: "HEX、OKLCH、HSL 或 RGB，带通道滑杆、不透明度和 Tailwind 色板。写回时仍用站点自己的颜色格式。",
  },
  {
    icon: TypeIcon,
    title: "字体与形状",
    body: "搜索并加载 Google Fonts，还有字距、圆角、间距和阴影，浅色与深色共用。",
  },
  {
    icon: ContrastIcon,
    title: "对比度检查",
    body: "15 组 coss 颜色对的 WCAG 比值，编辑时可以只看有问题的。",
  },
  {
    icon: HistoryIcon,
    title: "全部可撤销",
    body: "每次编辑都在历史里，⌘Z 和 ⌘⇧Z。可以回到预设，或回到站点原来的主题。",
  },
]

const formats = [
  "Tailwind v4 · OKLCH",
  "Tailwind v3 · HSL",
  "shadcn 注册表 JSON",
  "Token JSON",
  "tailwind.config.js",
  "Next.js 字体",
]

const faqs = [
  {
    q: "免费吗？",
    a: "免费。没有账户，不用注册，也没有付费档。",
  },
  {
    q: "主题存在哪里？",
    a: "只在你的浏览器里。Editor 用本地存储，扩展用 Chrome 的扩展存储。不会发到服务器。",
  },
  {
    q: "只能用于 coss ui 吗？",
    a: "它围绕 coss ui 的 token 集来做，使用 shadcn 风格 CSS 变量的站点也可以。",
  },
  {
    q: "这是 coss 的官方项目吗？",
    a: "不是。Cossplay 是独立项目。预设来自 tweakcn（Apache-2.0）。",
  },
]

function CliCommand() {
  const command = `npx shadcn@latest add ${site}/r/themes/violet-bloom.json`
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card p-2 pl-4 font-mono text-sm shadow-xs">
      <span className="min-w-0 flex-1 truncate">
        <span className="text-muted-foreground">$ </span>
        {command}
      </span>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="复制命令"
        onClick={() =>
          navigator.clipboard.writeText(command).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          })
        }
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  )
}

function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Logo />
          <div className="hidden items-center gap-5 text-muted-foreground text-sm sm:flex">
            <a href="#ways" className="hover:text-foreground">
              怎么用
            </a>
            <a href="#features" className="hover:text-foreground">
              功能
            </a>
            <a href="#ship" className="hover:text-foreground">
              带走它
            </a>
          </div>
          <Button size="sm" className="ml-auto" render={<a href="/editor" />}>
            打开 Editor
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 pt-16 pb-8 sm:pt-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <Badge variant="outline" className="gap-1.5">
              <LockIcon className="size-3" />
              免费 · 无需账户 · 在浏览器里运行
            </Badge>
            <h1 className="mt-5 text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
              给你的 coss ui 应用实时换主题。
            </h1>
            <p className="mt-5 text-pretty text-lg text-muted-foreground">
              试试 42 个预设，调颜色、字体和圆角，看着真实组件跟着变。然后导出
              Tailwind CSS，或用 shadcn CLI 装上这个主题。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" render={<a href="/editor" />}>
                打开 Editor
                <ArrowRightIcon />
              </Button>
              <AddToChrome />
            </div>
          </div>
          <ThemeDemo />
        </div>

        <Section
          id="ways"
          eyebrow="怎么用"
          title="主题在哪，就在哪改"
          lede="一个 Editor，三个地方都能用。Cossplay 只覆盖你改过的变量，其余仍跟着你的 CSS。"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {ways.map((way) => (
              <div
                key={way.title}
                className="flex flex-col gap-3 rounded-2xl border bg-card p-6"
              >
                <way.icon className="size-5 text-muted-foreground" />
                <h3 className="font-semibold">{way.title}</h3>
                <p className="flex-1 text-muted-foreground text-sm">
                  {way.body}
                </p>
                <div>{way.action}</div>
              </div>
            ))}
          </div>
          <img
            src="/screenshot.webp"
            width="1280"
            height="800"
            alt="用 Ocean Breeze 预设换过主题的 coss.com/ui；检查器显示 Get started 按钮的 token，Cossplay 侧边栏打开了 Primary 的通道滑杆"
            className="mt-10 w-full rounded-2xl border shadow-xl/5"
            loading="lazy"
          />
        </Section>

        <Section
          id="features"
          eyebrow="功能"
          title="一个主题需要的都在"
          lede="建在 coss ui 自己的 token 集上，包括 shadcn 主题没有的 info、success、warning 和 code 颜色。"
        >
          <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="bg-card p-6">
                <feature.icon className="size-5 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="ship"
          eyebrow="带走它"
          title="一条命令，从预设进到代码库"
          lede="每个预设都是一项 shadcn 注册表。用 CLI 安装，把 shadcn 的 MCP 服务接到编辑器，或按项目所用格式复制 CSS。"
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-3">
              <CliCommand />
              <p className="text-muted-foreground text-sm">
                改过主题？请从「导出」复制或下载。
              </p>
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {formats.map((format) => (
                <Badge key={format} variant="secondary" size="lg">
                  {format}
                </Badge>
              ))}
            </div>
          </div>
        </Section>

        <Section
          id="faq"
          eyebrow="常见问题"
          title="问题"
          lede="短答案：免费、本地、独立。"
        >
          <dl className="grid gap-8 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <dt className="font-semibold">{faq.q}</dt>
                <dd className="mt-2 text-muted-foreground">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <div className="mb-20 rounded-3xl border bg-muted/50 px-6 py-16 text-center">
          <h2 className="text-balance font-semibold text-3xl tracking-tight">
            让你的 coss ui 应用换身装。
          </h2>
          <p className="mt-3 text-muted-foreground">
            选一个预设，几秒内就能在真实组件上看见。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" render={<a href="/editor" />}>
              打开 Editor
              <ArrowRightIcon />
            </Button>
            <AddToChrome />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
