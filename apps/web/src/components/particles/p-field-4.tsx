import { Field, FieldError, FieldLabel } from "@cossplay/ui/components/field"
import { Input } from "@cossplay/ui/components/input"

export default function FieldWithErrorDemo() {
  return (
    <Field>
      <FieldLabel>Email</FieldLabel>
      <Input placeholder="Enter your email" type="email" />
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  )
}
