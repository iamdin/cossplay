import assert from "node:assert/strict"
import { tokenClasses } from "../coss/inspector"

if (typeof document === "undefined") {
  // @ts-expect-error jsdom loaded conditionally for DOM-less test runners
  const { JSDOM } = await import("jsdom")
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>")
  globalThis.document = dom.window.document
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
}

const tokensOf = (className: string) =>
  tokenClasses(className).map((c) => `${c.className} → ${c.token}`)

test("finds theme tokens in Tailwind classes, through variants and opacity", () => {
  assert.deepEqual(
    tokensOf(
      "inline-flex bg-primary text-primary-foreground hover:bg-primary/90 dark:focus-visible:ring-ring/50 border-t-input"
    ),
    [
      "bg-primary → primary",
      "text-primary-foreground → primary-foreground",
      "hover:bg-primary/90 → primary",
      "dark:focus-visible:ring-ring/50 → ring",
      "border-t-input → input",
    ]
  )
  assert.deepEqual(
    tokensOf(
      "bg-sidebar-primary fill-chart-1 ring-offset-background !text-muted-foreground font-mono"
    ),
    [
      "bg-sidebar-primary → sidebar-primary",
      "fill-chart-1 → chart-1",
      "ring-offset-background → background",
      "!text-muted-foreground → muted-foreground",
      "font-mono → font-mono",
    ]
  )
})

test("reads var() references in arbitrary values but not scoped overrides or non-tokens", () => {
  assert.deepEqual(
    tokensOf(
      "bg-[color-mix(in_srgb,var(--card),var(--color-white)_2%)] text-(--primary) [--radius:9999px] has-[:disabled]:opacity-64"
    ),
    [
      "bg-[color-mix(in_srgb,var(--card),var(--color-white)_2%)] → card",
      "text-(--primary) → primary",
    ]
  )
  assert.deepEqual(
    tokensOf(
      "text-sm bg-white border-transparent rounded-lg shadow-xs/5 size-4"
    ),
    []
  )
})
