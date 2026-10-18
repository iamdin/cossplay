"use client"

import { Button } from "@cossplay/ui/components/button"
import { useState } from "react"

export default function Particle() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    setIsLoading(true)

    window.setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Button loading={isLoading} onClick={handleClick}>
      Submit
    </Button>
  )
}
