import { colorTokens, isColor, type Token } from "./theme"

const colors = new Set<string>(colorTokens)
// 接受颜色的 Tailwind 工具类，例如 `bg-primary`、`border-t-input`、`ring-offset-background`。
const colorUtility =
  /^(?:bg|text|border(?:-[xytrbl]|-[se])?|ring(?:-offset)?|inset-ring|outline|fill|stroke|from|via|to|divide|placeholder|caret|accent|decoration|shadow|inset-shadow)-([a-z0-9-]+)(?:\/\S+)?$/

/** class 属性引用的主题 token，例如 `hover:bg-accent/50` → `accent`。 */
export function tokenClasses(className: string) {
  const found: { className: string; token: Token }[] = []
  for (const name of new Set(className.split(/\s+/))) {
    // 丢掉变体（`dark:hover:`），但保留任意值里的冒号（`[--radius:9999px]`）。
    const utility = name
      .split(/:(?![^[(]*[\])])/)
      .at(-1)!
      .replace(/^!|!$/g, "")
    const named = utility.match(colorUtility)?.[1]
    const font = utility.match(/^font-(sans|serif|mono)$/)?.[1]
    const referenced = [...utility.matchAll(/(?:var\(|\()--([a-z0-9-]+)/g)].map(
      (m) => m[1]
    )
    const tokens = new Set(
      [named, ...referenced].filter((t) => t && colors.has(t)) as Token[]
    )
    if (font) tokens.add(`font-${font}` as Token)
    for (const token of tokens) found.push({ className: name, token })
  }
  return found
}

const css = `
.box { position: fixed; display: none; box-sizing: border-box; border: 2px solid #3b82f6; border-radius: 3px; background: rgb(59 130 246 / 0.08); pointer-events: none; }
.card { position: fixed; display: none; box-sizing: border-box; max-width: 320px; padding: 4px; pointer-events: auto;
  font: 12px/1.4 ui-sans-serif, system-ui, sans-serif; color: #18181b; background: #fff;
  border: 1px solid #e4e4e7; border-radius: 8px; box-shadow: 0 8px 24px rgb(0 0 0 / 0.16); }
.title { padding: 2px 6px 4px; color: #71717a; font-size: 11px; }
button { all: unset; box-sizing: border-box; display: grid; grid-template-columns: 12px minmax(0, 1fr); align-items: center;
  column-gap: 6px; width: 100%; padding: 3px 6px; border-radius: 4px; cursor: pointer; }
button:hover, button:focus-visible { background: #f4f4f5; }
.swatch { width: 12px; height: 12px; box-sizing: border-box; border: 1px solid rgb(0 0 0 / 0.15); border-radius: 3px; }
.token { font-weight: 500; }
.classes { grid-column: 2; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #71717a; font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
`

/**
 * 在 `root` 上检查：悬停时框出最近的、class 引用了主题 token 的元素，并在卡片里列出这些 token。
 * 点列表中的 token，或只含一个 token 的元素，会调用 `onPick`；Escape 调用 `onExit`。
 * 检查时下层页面收不到点击，`.ui-chrome`（编辑器自己的控件）不动。返回清理函数。
 */
export function startInspector(
  root: Element,
  { onPick, onExit }: { onPick: (token: Token) => void; onExit: () => void }
) {
  // 自定义元素加 shadow root，让站点 CSS 碰不到这层覆盖。
  const host = document.createElement("cossplay-inspector")
  host.style.cssText =
    "all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;"
  const shadow = host.attachShadow({ mode: "open" })
  shadow.innerHTML = `<style>${css}</style><div class="box"></div><div class="card" role="dialog" aria-label="主题 token"></div>`
  const box = shadow.querySelector<HTMLElement>(".box")!
  const card = shadow.querySelector<HTMLElement>(".card")!
  document.documentElement.append(host)

  let current: Element | null = null
  const inPage = (event: Event) =>
    !event.composedPath().includes(host) &&
    event.target instanceof Element &&
    root.contains(event.target) &&
    !event.target.closest(".ui-chrome")
  const inspected = (node: Element) => {
    for (let el: Element | null = node; el && root.contains(el); )
      if (tokenClasses(el.getAttribute("class") ?? "").length) return el
      else el = el.parentElement
    return null
  }
  const hide = () => {
    current = null
    box.style.display = card.style.display = "none"
  }
  const show = (el: Element) => {
    current = el
    // 每个 token 一行；没有变体的用法（`bg-primary`）排在只有状态的前面。
    const byToken = new Map<Token, string[]>()
    for (const { className, token } of tokenClasses(
      el.getAttribute("class") ?? ""
    ).sort((a, b) => +a.className.includes(":") - +b.className.includes(":")))
      byToken.set(token, [...(byToken.get(token) ?? []), className])
    const styles = getComputedStyle(el)
    card.replaceChildren(
      Object.assign(document.createElement("div"), {
        className: "title",
        textContent: "点击 token 即可编辑",
      }),
      ...[...byToken].map(([token, names]) => {
        const button = document.createElement("button")
        button.title = `编辑 ${token}`
        const swatch = document.createElement("span")
        if (isColor(token)) {
          swatch.className = "swatch"
          swatch.style.background = styles.getPropertyValue(`--${token}`)
        }
        const label = Object.assign(document.createElement("span"), {
          className: "token",
          textContent: token,
        })
        const used = Object.assign(document.createElement("span"), {
          className: "classes",
          textContent: names.join(" "),
          title: names.join("\n"),
        })
        button.append(swatch, label, used)
        button.addEventListener("click", () => onPick(token))
        return button
      })
    )
    const rect = el.getBoundingClientRect()
    Object.assign(box.style, {
      display: "block",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    })
    // 放在元素下方并贴着它，指针才够得到卡片；放不下就放到上方。
    card.style.display = "block"
    const { width, height } = card.getBoundingClientRect()
    const below = rect.bottom + height <= innerHeight
    card.style.left = `${Math.max(4, Math.min(rect.left, innerWidth - width - 4))}px`
    card.style.top = `${below ? rect.bottom : Math.max(4, rect.top - height)}px`
  }

  const move = (event: PointerEvent) => {
    if (event.composedPath().includes(host)) return
    const el = inPage(event) ? inspected(event.target as Element) : null
    if (!el) hide()
    else if (el !== current) show(el)
  }
  const block = (event: Event) => {
    if (!inPage(event)) return
    event.preventDefault()
    event.stopPropagation()
    if (event.type !== "click") return
    const el = inspected(event.target as Element)
    const tokens = new Set(
      tokenClasses(el?.getAttribute("class") ?? "").map((c) => c.token)
    )
    if (tokens.size === 1) onPick([...tokens][0])
  }
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return
    event.preventDefault()
    stop()
    onExit()
  }
  const events = [
    ["pointermove", move],
    ["pointerdown", block],
    ["mousedown", block],
    ["pointerup", block],
    ["mouseup", block],
    ["click", block],
    ["keydown", keydown],
    ["scroll", hide],
    ["resize", hide],
  ] as const
  for (const [type, listener] of events)
    addEventListener(type, listener as EventListener, true)
  function stop() {
    for (const [type, listener] of events)
      removeEventListener(type, listener as EventListener, true)
    host.remove()
  }
  return stop
}
