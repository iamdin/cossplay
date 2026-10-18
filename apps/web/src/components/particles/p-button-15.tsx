import { Button } from "@cossplay/ui/components/button"
import { PlusIcon } from "lucide-react"

export default function Particle() {
  return (
    <Button aria-label="Add" size="icon-lg">
      <PlusIcon aria-hidden="true" />
    </Button>
  )
}
