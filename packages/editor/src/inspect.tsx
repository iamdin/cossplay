import type { Token } from "@cossplay/core/coss"
import { Toggle } from "@cossplay/ui/components/toggle"
import { SquareDashedMousePointer } from "lucide-react"
import { type Ref, useEffect } from "react"
import { fontTokens, usePanelStore } from "./store"

/** Turns inspect mode on and off; the host decides what gets inspected. */
export function InspectToggle({ ref }: { ref?: Ref<HTMLButtonElement> }) {
  const inspecting = usePanelStore((s) => s.inspecting)
  const detected = usePanelStore((s) => !!s.detection?.detected)
  // Escape in the panel ends it too; the extension's site tab is a separate document.
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
      aria-label="Inspect"
      title="Inspect: pick an element to edit its tokens · Esc to exit"
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
    ? "Typography"
    : token === "shadow-color"
      ? "Other"
      : "Colors"

/** Shows a token's control in the panel: its tab, its open section, scrolled to and focused. */
export async function focusControl(token: Token) {
  const find = () =>
    document.querySelector<HTMLInputElement>(
      `input[data-token="${CSS.escape(token)}"]`
    )
  // Clear the color search, which may hide the control; its sections then remount.
  if (usePanelStore.getState().search) {
    usePanelStore.setState({ search: "" })
    await new Promise(requestAnimationFrame)
  }
  if (!find())
    for (const tab of document.querySelectorAll<HTMLElement>(
      '[aria-label="Editor sections"] [role="tab"]'
    ))
      if (tab.textContent === sectionOf(token)) tab.click()
  // The tab's panel mounts on the next render.
  for (let frame = 0; frame < 10 && !find(); frame++)
    await new Promise(requestAnimationFrame)
  const input = find()
  if (!input) return
  const section = input.closest("details")
  if (section) section.open = true
  input.scrollIntoView({ block: "center" })
  input.focus({ preventScroll: true })
  // Focus from code shows no focus-visible ring, so flash the control's row.
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
