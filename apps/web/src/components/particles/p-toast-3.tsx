"use client"

import { Button } from "@cossplay/ui/components/button"
import { toastManager } from "@cossplay/ui/components/toast"

export default function Particle() {
  return (
    <Button
      onClick={() => {
        toastManager.add({
          description: "Please wait while we process your request.",
          title: "Loading…",
          type: "loading",
        })
      }}
      variant="outline"
    >
      Loading Toast
    </Button>
  )
}
