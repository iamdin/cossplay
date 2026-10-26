import { usePanelStore } from "@cossplay/editor/store"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@cossplay/ui/components/alert"
import { Button } from "@cossplay/ui/components/button"
import { Input } from "@cossplay/ui/components/input"
import { Spinner } from "@cossplay/ui/components/spinner"
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@cossplay/ui/components/tabs"
import {
  CircleCheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  RotateCwIcon,
} from "lucide-react"
import { type FormEvent, useEffect, useRef, useState } from "react"
import { previewCss } from "@/editor/host"

const BRIDGE = "https://cossplay.vercel.app/bridge.js"
const STORAGE_KEY = "cossplay:custom-url"
// The bridge answers a ping right away; past this it is treated as missing.
const TIMEOUT = 3000

const snippets: [string, string, string][] = [
  ["html", "HTML", `<!-- Inside <head> -->\n<script src="${BRIDGE}"></script>`],
  [
    "next-app",
    "Next.js App",
    `// app/layout.tsx\nimport Script from "next/script"\n\n// Inside <body>:\n{process.env.NODE_ENV === "development" && (\n  <Script src="${BRIDGE}" />\n)}`,
  ],
  [
    "next-pages",
    "Next.js Pages",
    `// pages/_document.tsx, inside <Head>:\n{process.env.NODE_ENV === "development" && (\n  <script src="${BRIDGE}" async />\n)}`,
  ],
  [
    "vite",
    "Vite",
    `<!-- index.html, inside <head> -->\n<script src="${BRIDGE}"></script>`,
  ],
  [
    "remix",
    "Remix",
    `// app/root.tsx, inside <head>:\n{process.env.NODE_ENV === "development" && (\n  <script src="${BRIDGE}" async />\n)}`,
  ],
]

function Setup() {
  return (
    <Tabs defaultValue="html" className="gap-2">
      <TabsList aria-label="Framework">
        {snippets.map(([value, label]) => (
          <TabsTab key={value} value={value}>
            {label}
          </TabsTab>
        ))}
      </TabsList>
      {snippets.map(([value, , code]) => (
        <TabsPanel key={value} value={value} className="relative">
          <pre className="overflow-x-auto rounded-lg border bg-muted p-3 pr-10 font-mono text-xs">
            {code}
          </pre>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Copy snippet"
            className="absolute top-1.5 right-1.5"
            onClick={async () => {
              await navigator.clipboard.writeText(code)
              usePanelStore.setState({ status: "Copied to clipboard" })
            }}
          >
            <CopyIcon />
          </Button>
        </TabsPanel>
      ))}
    </Tabs>
  )
}

// Accepts "localhost:3000" as well as full http(s) URLs.
function parseUrl(value: string) {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `http://${value}`)
    return url.href
  } catch {
    return null
  }
}

type Status = "loading" | "missing" | "no-coss" | "connected"

/** The user's own app in a frame, themed live through the bridge it includes. */
export function CustomPreview() {
  const frame = useRef<HTMLIFrameElement>(null)
  const [draft, setDraft] = useState("")
  const [src, setSrc] = useState("")
  // Bumped to remount the frame, which reloads it even at the same URL.
  const [reloads, setReloads] = useState(0)
  // A new object on every frame load, also for navigations inside the frame.
  const [loaded, setLoaded] = useState<{ origin: string } | null>(null)
  const [status, setStatus] = useState<Status>("loading")

  const open = (url: string) => {
    setSrc(url)
    setReloads((n) => n + 1)
    setLoaded(null)
    setStatus("loading")
  }

  useEffect(() => {
    let saved = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {}
    if (saved) {
      setDraft(saved)
      open(saved)
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    const { origin } = loaded
    const post = (message: object) =>
      frame.current?.contentWindow?.postMessage(
        { source: "cossplay", ...message },
        origin
      )
    let connected = false
    const send = async () => {
      if (!connected) return
      const state = usePanelStore.getState()
      post({
        type: "theme",
        css: await previewCss(state),
        dark: state.mode === "dark",
      })
    }
    const onMessage = ({ source, origin: from, data }: MessageEvent) => {
      if (source !== frame.current?.contentWindow || from !== origin) return
      if (
        data?.source !== "cossplay-bridge" ||
        data.type !== "status" ||
        typeof data.coss !== "boolean"
      )
        return
      setStatus(data.coss ? "connected" : "no-coss")
      if (data.coss) clearInterval(ping)
      if (!connected) {
        connected = true
        send()
      }
    }
    setStatus("loading")
    // Keeps pinging: a bridge may load late, and coss ui's styles may arrive after it.
    post({ type: "ping" })
    const ping = setInterval(() => post({ type: "ping" }), 500)
    addEventListener("message", onMessage)
    const unsubscribe = usePanelStore.subscribe(send)
    const timeout = setTimeout(
      () => setStatus((s) => (s === "loading" ? "missing" : s)),
      TIMEOUT
    )
    return () => {
      removeEventListener("message", onMessage)
      unsubscribe()
      clearInterval(ping)
      clearTimeout(timeout)
    }
  }, [loaded])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const url = parseUrl(draft.trim())
    if (!url) return
    try {
      localStorage.setItem(STORAGE_KEY, url)
    } catch {}
    setDraft(url)
    open(url)
  }

  return (
    <div className="flex h-full flex-col">
      <form
        onSubmit={submit}
        className="ui-chrome flex shrink-0 items-center gap-1 px-4 pb-3"
      >
        <Input
          aria-label="App URL"
          placeholder="http://localhost:3000"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-invalid={
            draft.trim() && !parseUrl(draft.trim()) ? true : undefined
          }
          className="flex-1"
        />
        <Button type="submit" variant="outline" size="sm">
          Load
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Reload"
          disabled={!src}
          onClick={() => open(src)}
        >
          <RotateCwIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Open in new tab"
          disabled={!src}
          render={
            <a href={src || undefined} target="_blank" rel="noreferrer" />
          }
        >
          <ExternalLinkIcon />
        </Button>
      </form>
      {!src ? (
        <div className="ui-chrome mx-auto flex w-full max-w-2xl flex-col gap-3 overflow-y-auto p-4 text-sm">
          <h2 className="text-base font-semibold">Preview your own app</h2>
          <p className="text-muted-foreground">
            Add the Cossplay bridge to your app (only in development is enough),
            start it, and enter its URL above. The editor then themes it live as
            you edit.
          </p>
          <Setup />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 px-4 pb-4">
          <div className="ui-chrome shrink-0">
            {status === "loading" && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Spinner className="size-3.5" /> Connecting to the bridge…
              </p>
            )}
            {status === "connected" && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <CircleCheckIcon className="size-3.5 text-success" /> Connected
                — edits apply live
              </p>
            )}
            {status === "no-coss" && (
              <Alert variant="warning">
                <AlertTitle>Connected, but no coss ui found</AlertTitle>
                <AlertDescription>
                  The bridge is running, but this page doesn't declare coss ui's
                  theme variables (such as --background, --primary and --info),
                  so the theme may not show. Install coss ui's theme, then
                  reload.
                </AlertDescription>
              </Alert>
            )}
            {status === "missing" && (
              <Alert variant="error">
                <AlertTitle>Bridge not found</AlertTitle>
                <AlertDescription>
                  <p>
                    No answer from {new URL(src).origin}. Add the bridge script
                    to your app and reload. Apps that block framing
                    (X-Frame-Options or a frame-ancestors CSP) can't be
                    previewed.
                  </p>
                  <Setup />
                </AlertDescription>
              </Alert>
            )}
          </div>
          <iframe
            key={reloads}
            ref={frame}
            src={src}
            title="Custom preview"
            onLoad={() => setLoaded({ origin: new URL(src).origin })}
            className="min-h-0 w-full flex-1 rounded-xl border bg-background"
          />
        </div>
      )}
    </div>
  )
}
