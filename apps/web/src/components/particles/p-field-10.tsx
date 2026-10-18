"use client"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@cossplay/ui/components/field"
import { Textarea } from "@cossplay/ui/components/textarea"

export default function Particle() {
  return (
    <Field>
      <FieldLabel>Bio</FieldLabel>
      <Textarea maxLength={500} placeholder="Tell us about yourself…" />
      <FieldDescription>
        Write a short bio. Maximum 500 characters.
      </FieldDescription>
    </Field>
  )
}
