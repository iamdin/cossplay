import { Badge } from "@cossplay/ui/components/badge"
import { CheckIcon } from "lucide-react"

export default function Particle() {
  return (
    <Badge variant="outline">
      <CheckIcon aria-hidden="true" />
      Verified
    </Badge>
  )
}
