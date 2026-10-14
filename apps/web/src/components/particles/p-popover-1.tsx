"use client"

import { Button } from "@cossplay/ui/components/button"
import { Field } from "@cossplay/ui/components/field"
import { Form } from "@cossplay/ui/components/form"
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@cossplay/ui/components/popover"
import { Textarea } from "@cossplay/ui/components/textarea"

export default function Particle() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        打开气泡
      </PopoverTrigger>
      <PopoverPopup className="w-80">
        <div className="mb-4">
          <PopoverTitle className="text-base">给我们反馈</PopoverTitle>
          <PopoverDescription>告诉我们能怎么改进。</PopoverDescription>
        </div>
        <Form className="flex w-full flex-col gap-4">
          <Field>
            <Textarea
              aria-label="发送反馈"
              id="feedback"
              placeholder="我们能怎么改进？"
            />
          </Field>
          <Button type="submit">发送反馈</Button>
        </Form>
      </PopoverPopup>
    </Popover>
  )
}
