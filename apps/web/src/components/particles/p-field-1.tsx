import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@cossplay/ui/components/field"
import { Input } from "@cossplay/ui/components/input"

export default function Particle() {
  return (
    <Field>
      <FieldLabel>Name</FieldLabel>
      <Input placeholder="Enter your name" type="text" />
      <FieldDescription>Visible on your profile</FieldDescription>
    </Field>
  )
}
