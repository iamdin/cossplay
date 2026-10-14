"use client"

import { Button } from "@cossplay/ui/components/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@cossplay/ui/components/input-group"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@cossplay/ui/components/tooltip"
import { ArrowRightIcon, MicIcon } from "lucide-react"

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupTextarea placeholder="Type a message…" />
      <InputGroupAddon align="block-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Voice message"
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <MicIcon />
          </TooltipTrigger>
          <TooltipPopup>Record voice message</TooltipPopup>
        </Tooltip>
        <InputGroupText className="ml-auto text-muted-foreground text-xs">
          Press Enter to send
        </InputGroupText>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Send message"
                className="rounded-full"
                size="icon-sm"
              />
            }
          >
            <ArrowRightIcon />
          </TooltipTrigger>
          <TooltipPopup>Send</TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}
