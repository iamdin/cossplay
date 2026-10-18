import { Field, FieldLabel } from "@cossplay/ui/components/field"
import { Switch } from "@cossplay/ui/components/switch"

export default function Particle() {
  return (
    <Field>
      <FieldLabel>
        <Switch />
        Email notifications
      </FieldLabel>
    </Field>
  )
}
