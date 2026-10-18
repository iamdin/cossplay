import { Input } from "@cossplay/ui/components/input"
import { Label } from "@cossplay/ui/components/label"
import { useId } from "react"

export default function Particle() {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        Email <span className="text-destructive">*</span>
      </Label>
      <Input id={id} placeholder="Email" required type="email" />
    </div>
  )
}
