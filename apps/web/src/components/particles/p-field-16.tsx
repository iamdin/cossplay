import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@cossplay/ui/components/field"
import { Slider } from "@cossplay/ui/components/slider"

export default function Particle() {
  return (
    <Field className="items-stretch gap-3">
      <FieldLabel>Country</FieldLabel>
      <Slider defaultValue={50} />
      <FieldDescription>This is an optional field</FieldDescription>
    </Field>
  )
}
