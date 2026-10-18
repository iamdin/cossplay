import { Label } from "@cossplay/ui/components/label"
import { Textarea } from "@cossplay/ui/components/textarea"
import { useId } from "react"

export default function Particle() {
  const id = useId()
  return (
    <div className="flex flex-col items-start gap-2">
      <Label htmlFor={id}>Message</Label>
      <Textarea id={id} placeholder="Type your message here" />
    </div>
  )
}
