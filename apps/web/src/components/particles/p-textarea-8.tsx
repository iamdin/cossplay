import { Label } from "@cossplay/ui/components/label"
import { Textarea } from "@cossplay/ui/components/textarea"
import { useId } from "react"

export default function Particle() {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex w-full items-center justify-between gap-2">
        <Label htmlFor={id}>Message</Label>
        <Label className="font-normal text-muted-foreground" render={<span />}>
          Optional
        </Label>
      </div>
      <Textarea id={id} placeholder="Type your message here" />
    </div>
  )
}
