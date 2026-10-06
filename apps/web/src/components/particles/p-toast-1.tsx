"use client"

import { Button } from "@cossplay/ui/components/button"
import { toastManager } from "@cossplay/ui/components/toast"

export default function Particle() {
  return (
    <Button
      onClick={() => {
        toastManager.add({
          description: "Monday, January 3rd at 6:00pm",
          title: "Event has been created",
        })
      }}
      variant="outline"
    >
      Default Toast
    </Button>
  )
}
