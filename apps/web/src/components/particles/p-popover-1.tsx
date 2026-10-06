"use client"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"

export default function Particle() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Open Popover
      </PopoverTrigger>
      <PopoverPopup className="w-80">
        <div className="mb-4">
          <PopoverTitle className="text-base">Send us feedback</PopoverTitle>
          <PopoverDescription>
            Let us know how we can improve.
          </PopoverDescription>
        </div>
        <Form className="flex w-full flex-col gap-4">
          <Field>
            <Textarea
              aria-label="Send feedback"
              id="feedback"
              placeholder="How can we improve?"
            />
          </Field>
          <Button type="submit">Send feedback</Button>
        </Form>
      </PopoverPopup>
    </Popover>
  )
}
