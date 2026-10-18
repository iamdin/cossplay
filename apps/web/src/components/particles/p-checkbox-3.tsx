import { Checkbox } from "@cossplay/ui/components/checkbox"
import { Label } from "@cossplay/ui/components/label"
import { useId } from "react"

export default function Particle() {
  const id = useId()

  return (
    <div className="flex items-start gap-2">
      <Checkbox defaultChecked id={id} />
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>Accept terms and conditions</Label>
        <p className="text-muted-foreground text-xs">
          By clicking this checkbox, you agree to the terms and conditions.
        </p>
      </div>
    </div>
  )
}
