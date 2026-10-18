"use client"

import { Field, FieldDescription } from "@cossplay/ui/components/field"
import { Textarea } from "@cossplay/ui/components/textarea"
import { useState } from "react"

export default function Particle() {
  const maxLength = 280
  const [value, setValue] = useState("")

  return (
    <Field>
      <Textarea
        aria-label="Message"
        maxLength={maxLength}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your message here"
        value={value}
      />
      <FieldDescription>
        <span className="tabular-nums">{maxLength - value.length}</span>{" "}
        characters left
      </FieldDescription>
    </Field>
  )
}
