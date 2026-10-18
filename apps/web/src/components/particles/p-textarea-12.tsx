import { Field, FieldError, FieldLabel } from "@cossplay/ui/components/field"
import { Textarea } from "@cossplay/ui/components/textarea"

export default function Particle() {
  return (
    <Field>
      <FieldLabel>
        Message <span className="text-destructive-foreground">*</span>
      </FieldLabel>
      <Textarea placeholder="Type your message here" required />
      <FieldError>Please fill out this field.</FieldError>
    </Field>
  )
}
