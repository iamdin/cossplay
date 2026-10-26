import { colorTokens, isColor, type Token } from "./theme"

const colors = new Set<string>(colorTokens)
// Tailwind utilities that take a color, e.g. `bg-primary`, `border-t-input`, `ring-offset-background`.
const colorUtility =
  /^(?:bg|text|border(?:-[xytrbl]|-[se])?|ring(?:-offset)?|inset-ring|outline|fill|stroke|from|via|to|divide|placeholder|caret|accent|decoration|shadow|inset-shadow)-([a-z0-9-]+)(?:\/\S+)?$/

/**
 * Detects whether a CSS custom property is overridden locally on or above `el`,
 * returning a concise badge description if overridden, or null if using root value.
 */
export function tokenOverrideSource(
  el: Element,
  token: Token,
  elStyles?: CSSStyleDeclaration,
  rootStyles?: CSSStyleDeclaration
): string | null {
  try {
    const root = document.documentElement
    const rootVal = (rootStyles ?? getComputedStyle(root))
      .getPropertyValue(`--${token}`)
      .trim()
    const elVal = (elStyles ?? getComputedStyle(el))
      .getPropertyValue(`--${token}`)
      .trim()
    if (!elVal || !rootVal || elVal === rootVal) return null

    for (let p: Element | null = el; p && p !== root; p = p.parentElement) {
      const parentVal = p.parentElement
        ? getComputedStyle(p.parentElement)
            .getPropertyValue(`--${token}`)
            .trim()
        : rootVal
      const thisVal = (
        p === el ? (elStyles ?? getComputedStyle(p)) : getComputedStyle(p)
      )
        .getPropertyValue(`--${token}`)
        .trim()
      if (thisVal !== parentVal) {
        if (p.classList.contains("dark")) return "⚡ .dark"
        if (
          p.hasAttribute("style") &&
          p.getAttribute("style")!.includes(`--${token}`)
        )
          return "⚡ inline"
        if (p.id) return `⚡ #${p.id}`
        const cls = (p.getAttribute("class") ?? "").trim().split(/\s+/)[0]
        if (cls) return `⚡ .${cls}`
        return `⚡ <${p.tagName.toLowerCase()}>`
      }
    }
  } catch {}
  return null
}

/** The theme tokens a class attribute references, e.g. `hover:bg-accent/50` → `accent`. */
export function tokenClasses(className: string) {
  const found: { className: string; token: Token }[] = []
  for (const name of new Set(className.split(/\s+/))) {
    // Drop variants (`dark:hover:`) but not colons inside arbitrary values (`[--radius:9999px]`).
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
button { all: unset; box-sizing: border-box; display: grid; grid-template-columns: 12px minmax(0, 1fr) auto; align-items: center;
  column-gap: 6px; width: 100%; padding: 3px 6px; border-radius: 4px; cursor: pointer; }
button:hover, button:focus-visible { background: #f4f4f5; }
.swatch { width: 12px; height: 12px; box-sizing: border-box; border: 1px solid rgb(0 0 0 / 0.15); border-radius: 3px; }
.token { font-weight: 500; }
.classes { grid-column: 2; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #71717a; font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.badge { grid-column: 3; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: 500; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; white-space: nowrap; }
`

/**
 * Inspect mode over `root`: hovering outlines the nearest element whose classes reference theme
 * tokens and lists those tokens in a card. Clicking a listed token, or an element with a single token,
 * calls `onPick`; Escape calls `onExit`. The page underneath gets no clicks while inspecting, and
 * `.ui-chrome` (the editor's own controls) is left alone. Returns a cleanup.
 */
export function startInspector(
  root: Element,
  { onPick, onExit }: { onPick: (token: Token) => void; onExit: () => void }
) {
  // A custom element in a shadow root keeps the site's CSS away from the overlay.
  const host = document.createElement("cossplay-inspector")
  host.style.cssText =
    "all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;"
  const shadow = host.attachShadow({ mode: "open" })
  shadow.innerHTML = `<style>${css}</style><div class="box"></div><div class="card" role="dialog" aria-label="Theme tokens"></div>`
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
    for (let el: Element | null = node; el && root.contains(el);)
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
    // One row per token; tokens used without a variant (`bg-primary`) before state-only ones.
    const byToken = new Map<Token, string[]>()
    for (const { className, token } of tokenClasses(
      el.getAttribute("class") ?? ""
    ).sort((a, b) => +a.className.includes(":") - +b.className.includes(":")))
      byToken.set(token, [...(byToken.get(token) ?? []), className])
    const styles = getComputedStyle(el)
    const rootStyles = getComputedStyle(document.documentElement)
    card.replaceChildren(
      Object.assign(document.createElement("div"), {
        className: "title",
        textContent: "Click a token to edit it",
      }),
      ...[...byToken].map(([token, names]) => {
        const button = document.createElement("button")
        button.title = `Edit ${token}`
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
        const overrideBadge = tokenOverrideSource(el, token, styles, rootStyles)
        if (overrideBadge) {
          const badge = Object.assign(document.createElement("span"), {
            className: "badge",
            textContent: overrideBadge,
            title: `Overridden at ancestor or local rule for --${token}`,
          })
          button.append(badge)
        }
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
    // Below the element, touching it so the pointer can reach the card; above when there is no room.
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
