import { Button } from "@cossplay/ui/components/button"
import { Spinner } from "@cossplay/ui/components/spinner"

export default function Particle() {
  return (
    <Button disabled>
      <Spinner />
      Loading...
    </Button>
  )
}
