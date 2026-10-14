import type { Token } from "@cossplay/core/coss"
import { Toggle } from "@cossplay/ui/components/toggle"
import { SquareDashedMousePointer } from "lucide-react"
import { type Ref, useEffect } from "react"
import { fontTokens, usePanelStore } from "./store"

/** 开关检查模式；检查哪一块由 Host 决定。 */
export function InspectToggle({ ref }: { ref?: Ref<HTMLButtonElement> }) {
  const inspecting = usePanelStore((s) => s.inspecting)
  const detected = usePanelStore((s) => !!s.detection?.detected)
  // 面板里按 Escape 也会结束；扩展里的站点标签页是另一份文档。
  useEffect(() => {
    if (!inspecting) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") usePanelStore.setState({ inspecting: false })
    }
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  }, [inspecting])
  return (
    <Toggle
      ref={ref}
      size="sm"
      aria-label="检查"
      title="检查：点选元素以编辑它的 token · Esc 退出"
      disabled={!detected}
      pressed={inspecting}
      onPressedChange={(pressed) =>
        usePanelStore.setState({ inspecting: pressed })
      }
    >
      <SquareDashedMousePointer />
    </Toggle>
  )
}

const sectionOf = (token: Token) =>
  (fontTokens as readonly string[]).includes(token)
    ? "排版"
    : token === "shadow-color"
      ? "其他"
      : "颜色"

/** 在面板里露出该 token 的控件：切到对应标签、展开分组、滚到并聚焦。 */
export async function focusControl(token: Token) {
  const find = () =>
    document.querySelector<HTMLInputElement>(
      `input[data-token="${CSS.escape(token)}"]`
    )
  // 清掉颜色搜索，否则控件可能被藏起来；分组随后会重新挂载。
  if (usePanelStore.getState().search) {
    usePanelStore.setState({ search: "" })
    await new Promise(requestAnimationFrame)
  }
  if (!find())
    for (const tab of document.querySelectorAll<HTMLElement>(
      '[aria-label="编辑分区"] [role="tab"]'
    ))
      if (tab.textContent === sectionOf(token)) tab.click()
  // 标签页内容在下一次渲染才挂上。
  for (let frame = 0; frame < 10 && !find(); frame++)
    await new Promise(requestAnimationFrame)
  const input = find()
  if (!input) return
  const section = input.closest("details")
  if (section) section.open = true
  input.scrollIntoView({ block: "center" })
  input.focus({ preventScroll: true })
  // 代码触发的聚焦没有 focus-visible 环，所以闪一下这一行。
  ;(input.closest("[data-control]") ?? input).animate(
    [
      {
        backgroundColor: "color-mix(in srgb, var(--ring) 24%, transparent)",
        boxShadow: "0 0 0 2px var(--ring)",
      },
      {},
    ],
    { duration: 1200, easing: "ease-out" }
  )
}
