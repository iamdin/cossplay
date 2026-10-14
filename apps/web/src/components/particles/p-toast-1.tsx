"use client"

import { Button } from "@cossplay/ui/components/button"
import { toastManager } from "@cossplay/ui/components/toast"

export default function Particle() {
  return (
    <Button
      onClick={() => {
        toastManager.add({
          description: "1 月 3 日星期一 18:00",
          title: "活动已创建",
        })
      }}
      variant="outline"
    >
      默认吐司
    </Button>
  )
}
