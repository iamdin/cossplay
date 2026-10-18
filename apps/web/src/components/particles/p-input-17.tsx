import { Input } from "@cossplay/ui/components/input"
import { useId } from "react"

export default function Particle() {
  const id = useId()
  return (
    <Input
      className="read-only:bg-muted"
      defaultValue="This is a read-only input"
      id={id}
      readOnly
      type="text"
    />
  )
}
