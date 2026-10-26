import { Button } from "@cossplay/ui/components/button"
import { XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { dismissGuide, isGuideDismissed } from "./getting-started-storage"

export function GettingStarted() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!isGuideDismissed())
  }, [])

  if (!visible) return null

  return (
    <section
      aria-labelledby="getting-started-title"
      className="mx-2 my-2 shrink-0 border bg-card p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="getting-started-title" className="text-xs font-semibold">
          Getting started
        </h2>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Dismiss getting started"
          onClick={() => {
            setVisible(false)
            dismissGuide()
          }}
        >
          <XIcon />
        </Button>
      </div>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
        <li>Choose a preset above.</li>
        <li>Adjust colors, fonts and radius below.</li>
        <li>Switch previews on the right.</li>
        <li>Use Export above the preview to copy or download CSS or JSON.</li>
      </ol>
    </section>
  )
}
