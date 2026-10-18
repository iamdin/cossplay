"use client"

import { Field, FieldDescription } from "@cossplay/ui/components/field"
import { Input } from "@cossplay/ui/components/input"
import { useState } from "react"

export default function Particle() {
  const maxLength = 14
  const [value, setValue] = useState("")

  return (
    <Field>
      <Input
        aria-label="Code"
        maxLength={maxLength}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter code"
        type="text"
        value={value}
      />
      <FieldDescription>
        <span className="tabular-nums">{maxLength - value.length}</span>{" "}
        characters left
      </FieldDescription>
    </Field>
  )
}
