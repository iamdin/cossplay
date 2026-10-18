import { Toggle } from "@cossplay/ui/components/toggle"
import { BoldIcon } from "lucide-react"

export default function Particle() {
  return (
    <Toggle aria-label="Toggle bold" variant="outline">
      <BoldIcon />
    </Toggle>
  )
}
