import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@cossplay/ui/components/field"
import { Input } from "@cossplay/ui/components/input"

export default function Particle() {
  return (
    <Field disabled>
      <FieldLabel>Email</FieldLabel>
      <Input disabled placeholder="Enter your email" type="email" />
      <FieldDescription>This field is currently disabled.</FieldDescription>
    </Field>
  )
}
