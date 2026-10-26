import { Badge } from "@cossplay/ui/components/badge"
import { Button } from "@cossplay/ui/components/button"
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@cossplay/ui/components/dialog"
import { createFileRoute } from "@tanstack/react-router"
import {
  ArrowRightIcon,
  CheckIcon,
  ChromeIcon,
  CodeIcon,
  ContrastIcon,
  CopyIcon,
  HistoryIcon,
  PaletteIcon,
  PanelRightIcon,
  SquareDashedMousePointerIcon,
  TypeIcon,
} from "lucide-react"
import { type ReactNode, useState } from "react"
import { Footer, Logo } from "@/landing/chrome"
import { ThemeChips, useLandingTheme } from "@/landing/demo"
import styles from "@/styles/landing.css?url"

const site = "https://cossplay.vercel.app"
const title = "Cossplay: visual UI theme editor for coss ui"
const description =
  "Visually customize a UI theme, see changes on real coss ui components live, and export Tailwind CSS (v3 or v4) or JSON. Cossplay is an independent theme editor."

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

const chromeStoreUrl =
  "https://chromewebstore.google.com/detail/odlgjkdboieignihoolihlebjhmjemlp"

function AddToChrome() {
  return (
    <Button
      size="lg"
      variant="outline"
      render={<a href={chromeStoreUrl} target="_blank" rel="noreferrer" />}
    >
      <ChromeIcon />
      Add to Chrome
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
      <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">
        {lede}
      </p>
      <div className="mt-12">{children}</div>
    </section>
  )
}

const ways = [
  {
    icon: CodeIcon,
    title: "In the browser",
    body: "Open the editor and theme a gallery of real coss ui components: cards, dashboard, mail, marketing and app pages. Nothing to install.",
    action: (
      <a
        href="/editor"
        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
      >
        Open the editor <ArrowRightIcon className="size-4" />
      </a>
    ),
  },
  {
    icon: PanelRightIcon,
    title: "On any coss ui site",
    body: "The Chrome extension docks in the side panel and edits the theme of the page you're on, localhost or production, and remembers it per site.",
    action: (
      <a
        href={chromeStoreUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
      >
        Add to Chrome <ArrowRightIcon className="size-4" />
      </a>
    ),
  },
  {
    icon: PaletteIcon,
    title: "In your own app, from the editor",
    body: "Add one script tag in development and the editor's Custom tab themes your running app live, next to the controls.",
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
    title: "42 presets, coss-aware",
    body: "Every tweakcn preset plus coss ui's default, mapped onto coss tokens like info, success, warning and code. Search, step through or shuffle them.",
  },
  {
    icon: SquareDashedMousePointerIcon,
    title: "Inspect to edit",
    body: "Point at any element to see which tokens color it, then click to jump straight to that control.",
  },
  {
    icon: CodeIcon,
    title: "Precise color editing",
    body: "HEX, OKLCH, HSL or RGB with channel sliders, opacity and the Tailwind palette. Values are written back in the site's own format.",
  },
  {
    icon: TypeIcon,
    title: "Type and shape",
    body: "Google Fonts search and loading, letter spacing, radius, spacing and shadows, shared across light and dark.",
  },
  {
    icon: ContrastIcon,
    title: "Contrast checks",
    body: "WCAG ratios for 15 coss color pairs, with an issues-only view while you edit.",
  },
  {
    icon: HistoryIcon,
    title: "Undo everything",
    body: "Every edit is in history with ⌘Z and ⌘⇧Z. Reset to the preset, or back to the site's original theme.",
  },
]

const formats = [
  "Tailwind v4 · OKLCH",
  "Tailwind v3 · HSL",
  "shadcn registry JSON",
  "Token JSON",
  "tailwind.config.js",
  "Next.js fonts",
]

const faqs = [
  {
    q: "Is it free?",
    a: "Yes. No account, no sign-up, no paid tier.",
  },
  {
    q: "Where are my themes stored?",
    a: "In your browser only. The editor uses local storage and the extension uses Chrome's extension storage. Nothing is sent to a server.",
  },
  {
    q: "Does it only work with coss ui?",
    a: "It's built around coss ui's token set, and also works on sites that use shadcn-style CSS variables.",
  },
  {
    q: "Is this an official coss project?",
    a: "No. Cossplay is an independent project. Presets come from tweakcn (Apache-2.0).",
  },
]

function CliCommand() {
  const command = `npx shadcn@latest add ${site}/r/themes/modern-minimal.json`
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
        aria-label="Copy command"
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

const checks = [
  "No account required",
  "Nothing to install",
  "Export to Tailwind v4",
]

const shots = [
  {
    src: "/editor.webp",
    caption: "Editor",
    alt: "Cossplay editor themed with the Mono preset; the color panel is on the left and the component gallery is on the right",
  },
  {
    src: "/screenshot.webp",
    caption: "Chrome extension",
    alt: "coss.com/ui themed with the Mono preset; the inspector shows the tokens of the Get started button, and the Cossplay side panel has Primary's channel sliders open",
  },
]

function Screenshot({
  src,
  alt,
  caption,
}: {
  src: string
  alt: string
  caption: string
}) {
  return (
    <figure className="min-w-0">
      <Dialog>
        <DialogTrigger
          aria-label={`View ${caption} larger`}
          className="block w-full min-w-0 cursor-zoom-in overflow-hidden"
        >
          <img
            src={src}
            width={1280}
            height={800}
            alt={alt}
            className="aspect-[8/5] h-auto w-full max-w-full rounded-2xl border object-cover shadow-xl/5"
            loading="lazy"
          />
        </DialogTrigger>
        <DialogPopup
          bottomStickOnMobile={false}
          className="max-h-[calc(100dvh-2rem)] w-[min(72rem,calc(100vw-2rem))] max-w-none overflow-y-auto p-3"
        >
          <DialogTitle className="sr-only">{caption}</DialogTitle>
          <img
            src={src}
            alt={alt}
            className="mt-8 h-auto max-h-[80vh] w-full rounded-xl object-contain"
          />
        </DialogPopup>
      </Dialog>
      <figcaption className="mt-3 text-sm text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  )
}

function Landing() {
  const { id, setId, style } = useLandingTheme()
  return (
    <div
      className="min-h-dvh overflow-x-clip bg-background text-foreground"
      style={{ ...style, fontFamily: "var(--font-sans)" }}
    >
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Logo />
          <div className="hidden items-center gap-5 text-sm text-muted-foreground sm:flex">
            <a href="#ways" className="hover:text-foreground">
              How to use
            </a>
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#ship" className="hover:text-foreground">
              Ship it
            </a>
            <a
              href="https://coss.com/ui/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              coss ui docs
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <Button size="sm" className="ml-auto" render={<a href="/editor" />}>
            Open the editor
          </Button>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-4 pt-16 text-center sm:pt-24">
          <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Customize your UI theme,{" "}
            <span className="font-serif text-primary italic">live.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
            Choose a preset, tune colors, fonts and radius, and see changes
            live. Export your theme as Tailwind CSS (v3 or v4) or JSON.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-pretty text-muted-foreground">
            Cossplay is an independent tool for theming{" "}
            <a
              href="https://coss.com/ui/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              coss ui
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            , a React component library.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
            <Button size="lg" render={<a href="/editor" />}>
              Open the editor
              <ArrowRightIcon />
            </Button>
            <AddToChrome />
            <Button size="lg" variant="outline" render={<a href="#ship" />}>
              Install a preset
            </Button>
          </div>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {checks.map((check) => (
              <li key={check} className="inline-flex items-center gap-1.5">
                <CheckIcon className="size-3.5" />
                {check}
              </li>
            ))}
          </ul>
        </section>
        <ThemeChips id={id} onSelect={setId} />

        <div className="mx-auto max-w-6xl min-w-0 px-4 sm:px-6">
          <Section
            id="ways"
            eyebrow="How to use"
            title="Wherever your theme lives"
            lede="One editor, three places to use it. Cossplay only overrides the variables you change; everything else keeps following your CSS."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {ways.map((way) => (
                <div
                  key={way.title}
                  className="flex flex-col gap-3 rounded-2xl border bg-card p-6"
                >
                  <way.icon className="size-5 text-muted-foreground" />
                  <h3 className="font-semibold">{way.title}</h3>
                  <p className="flex-1 text-sm text-muted-foreground">
                    {way.body}
                  </p>
                  <div>{way.action}</div>
                </div>
              ))}
            </div>
            <div className="mt-10 grid min-w-0 items-start gap-4 lg:grid-cols-2">
              {shots.map((shot) => (
                <Screenshot key={shot.src} {...shot} />
              ))}
            </div>
          </Section>

          <Section
            id="features"
            eyebrow="Features"
            title="Everything a theme needs"
            lede="Built on coss ui's own token set, including the info, success, warning and code colors that shadcn themes don't have."
          >
            <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="bg-card p-6">
                  <feature.icon className="size-5 text-muted-foreground" />
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="ship"
            eyebrow="Ship it"
            title="From preset to your codebase in one command"
            lede="Every preset is a shadcn registry item. Install it with the CLI, connect shadcn's MCP server to your editor, or copy the CSS in the format your project uses."
          >
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-3">
                <CliCommand />
                <p className="text-sm text-muted-foreground">
                  Edited a theme? Copy or download it from Export instead.
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
            eyebrow="FAQ"
            title="Questions"
            lede="The short version: free, local, and independent."
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
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              Let your coss ui app play dress-up.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pick a preset and see it on real components in seconds.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" render={<a href="/editor" />}>
                Open the editor
                <ArrowRightIcon />
              </Button>
              <AddToChrome />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
