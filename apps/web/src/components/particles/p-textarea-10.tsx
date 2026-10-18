import { Textarea } from "@cossplay/ui/components/textarea"
import { useId } from "react"

export default function Particle() {
  const id = useId()
  return (
    <Textarea
      aria-label="Read-only text"
      className="read-only:bg-muted"
      defaultValue="This is a read-only textarea"
      id={id}
      readOnly
    />
  )
}
