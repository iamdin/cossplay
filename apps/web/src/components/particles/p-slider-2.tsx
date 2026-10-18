import { Field, FieldLabel } from "@cossplay/ui/components/field"
import { Slider, SliderValue } from "@cossplay/ui/components/slider"

export default function Particle() {
  return (
    <Field>
      <Slider defaultValue={50}>
        <div className="mb-2 flex items-center justify-between gap-1">
          <FieldLabel className="font-medium text-sm">Opacity</FieldLabel>
          <SliderValue />
        </div>
      </Slider>
    </Field>
  )
}
