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
  [
    "html",
    "HTML",
    `<!-- 放在 <head> 里 -->\n<script src="${BRIDGE}"></script>`,
  ],
  [
    "next-app",
    "Next.js App",
    `// app/layout.tsx\nimport Script from "next/script"\n\n// 放在 <body> 里：\n{process.env.NODE_ENV === "development" && (\n  <Script src="${BRIDGE}" />\n)}`,
  ],
  [
    "next-pages",
    "Next.js Pages",
    `// pages/_document.tsx，放在 <Head> 里：\n{process.env.NODE_ENV === "development" && (\n  <script src="${BRIDGE}" async />\n)}`,
  ],
  [
    "vite",
    "Vite",
    `<!-- index.html，放在 <head> 里 -->\n<script src="${BRIDGE}"></script>`,
  ],
  [
    "remix",
    "Remix",
    `// app/root.tsx，放在 <head> 里：\n{process.env.NODE_ENV === "development" && (\n  <script src="${BRIDGE}" async />\n)}`,
  ],
]

function Setup() {
  return (
    <Tabs defaultValue="html" className="gap-2">
      <TabsList aria-label="框架">
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
            aria-label="复制片段"
            className="absolute top-1.5 right-1.5"
            onClick={async () => {
              await navigator.clipboard.writeText(code)
              usePanelStore.setState({ status: "已复制到剪贴板" })
            }}
          >
            <CopyIcon />
          </Button>
        </TabsPanel>
      ))}
    </Tabs>
  )
}

// 接受 "localhost:3000"，也接受完整的 http(s) 地址。
function parseUrl(value: string) {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `http://${value}`)
    return url.href
  } catch {
    return null
  }
}

type Status = "loading" | "missing" | "no-coss" | "connected"

/** 用户自己的应用放在框架里，靠它引入的 Bridge 实时换主题。 */
export function CustomPreview() {
  const frame = useRef<HTMLIFrameElement>(null)
  const [draft, setDraft] = useState("")
  const [src, setSrc] = useState("")
  // 递增以重新挂载框架，同一 URL 也会重新加载。
  const [reloads, setReloads] = useState(0)
  // 每次框架加载都换一个新对象，框架内跳转也一样。
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
    // 持续 ping：Bridge 可能晚到，coss ui 的样式也可能在它之后才到。
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
          aria-label="应用 URL"
          placeholder="http://localhost:3000"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-invalid={
            draft.trim() && !parseUrl(draft.trim()) ? true : undefined
          }
          className="flex-1"
        />
        <Button type="submit" variant="outline" size="sm">
          加载
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="重新加载"
          disabled={!src}
          onClick={() => open(src)}
        >
          <RotateCwIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="在新标签页打开"
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
          <h2 className="font-semibold text-base">预览你自己的应用</h2>
          <p className="text-muted-foreground">
            把 Cossplay
            的桥接脚本加到应用里（只在开发环境即可），启动它，再在上面填
            URL。之后编辑器会在你编辑时实时给它换主题。
          </p>
          <Setup />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 px-4 pb-4">
          <div className="ui-chrome shrink-0">
            {status === "loading" && (
              <p className="flex items-center gap-2 text-muted-foreground text-xs">
                <Spinner className="size-3.5" /> 正在连接桥接脚本…
              </p>
            )}
            {status === "connected" && (
              <p className="flex items-center gap-2 text-muted-foreground text-xs">
                <CircleCheckIcon className="size-3.5 text-success" /> 已连接 —
                编辑会实时生效
              </p>
            )}
            {status === "no-coss" && (
              <Alert variant="warning">
                <AlertTitle>已连接，但没有找到 coss ui</AlertTitle>
                <AlertDescription>
                  桥接脚本在运行，但这个页面没有声明 coss ui 的主题变量（例如
                  --background、--primary 和
                  --info），所以主题可能显示不出来。请装上 coss ui
                  的主题，然后重新加载。
                </AlertDescription>
              </Alert>
            )}
            {status === "missing" && (
              <Alert variant="error">
                <AlertTitle>没有找到桥接脚本</AlertTitle>
                <AlertDescription>
                  <p>
                    {new URL(src).origin}{" "}
                    没有回应。请把桥接脚本加到应用里并重新加载。禁止被嵌入的应用（X-Frame-Options
                    或 frame-ancestors CSP）无法预览。
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
            title="自定义预览"
            onLoad={() => setLoaded({ origin: new URL(src).origin })}
            className="min-h-0 w-full flex-1 rounded-xl border bg-background"
          />
        </div>
      )}
    </div>
  )
}
