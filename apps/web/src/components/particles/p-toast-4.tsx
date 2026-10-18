"use client"

import { Button } from "@cossplay/ui/components/button"
import { toastManager } from "@cossplay/ui/components/toast"

export default function Particle() {
  return (
    <Button
      onClick={() => {
        const id = toastManager.add({
          actionProps: {
            children: "Undo",
            onClick: () => {
              toastManager.close(id)
              toastManager.add({
                description: "The action has been reverted.",
                title: "Action undone",
                type: "info",
              })
            },
          },
          description: "You can undo this action.",
          timeout: 1000000,
          title: "Action performed",
          type: "success",
        })
      }}
      variant="outline"
    >
      Perform Action
    </Button>
  )
}
