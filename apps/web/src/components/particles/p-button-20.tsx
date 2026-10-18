import { Button } from "@cossplay/ui/components/button"
import { ChevronLeftIcon } from "lucide-react"

export default function Particle() {
  return (
    <Button variant="link">
      <ChevronLeftIcon aria-hidden="true" />
      Go back
    </Button>
  )
}
