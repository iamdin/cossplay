import { Field, FieldError, FieldLabel } from "@cossplay/ui/components/field"
import { Input } from "@cossplay/ui/components/input"

export default function Particle() {
  return (
    <Field>
      <FieldLabel>
        Password <span className="text-destructive-foreground">*</span>
      </FieldLabel>
      <Input placeholder="Enter password" required type="password" />
      <FieldError>Please fill out this field.</FieldError>
    </Field>
  )
}
