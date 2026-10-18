import { Input } from "@cossplay/ui/components/input"
import { Label } from "@cossplay/ui/components/label"
import { useId } from "react"

export default function Particle() {
  const id = useId()
  return (
    <div className="flex flex-col items-start gap-2">
      <Label htmlFor={id}>Email</Label>
      <Input
        aria-label="Email"
        id={id}
        placeholder="you@example.com"
        type="email"
      />
    </div>
  )
}
