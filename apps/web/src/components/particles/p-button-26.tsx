"use client"

import { Button } from "@cossplay/ui/components/button"
import { StarIcon } from "lucide-react"
import { useState } from "react"

export default function Particle() {
  const [isStarred, setIsStarred] = useState(false)
  const count = isStarred ? 730 : 729

  return (
    <Button onClick={() => setIsStarred(!isStarred)}>
      <StarIcon
        aria-hidden="true"
        className={`${isStarred ? "fill-yellow-500 text-yellow-500" : undefined}`}
      />
      <span className="flex items-baseline gap-2">
        {isStarred ? "Starred" : "Star"}
        <span className="text-primary-foreground/64 text-xs">{count}</span>
      </span>
    </Button>
  )
}
