import { Badge } from "@cossplay/ui/components/badge"
import { Button } from "@cossplay/ui/components/button"

export default function Particle() {
  return (
    <Button variant="outline">
      Messages
      <Badge className="-me-1" variant="outline">
        18
      </Badge>
    </Button>
  )
}
