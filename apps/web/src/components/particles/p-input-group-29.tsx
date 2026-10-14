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
      <InputGroupTextarea placeholder="输入消息…" />
      <InputGroupAddon align="block-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="语音消息"
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <MicIcon />
          </TooltipTrigger>
          <TooltipPopup>录制语音</TooltipPopup>
        </Tooltip>
        <InputGroupText className="ml-auto text-muted-foreground text-xs">
          按 Enter 发送
        </InputGroupText>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="发送消息"
                className="rounded-full"
                size="icon-sm"
              />
            }
          >
            <ArrowRightIcon />
          </TooltipTrigger>
          <TooltipPopup>发送</TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}
