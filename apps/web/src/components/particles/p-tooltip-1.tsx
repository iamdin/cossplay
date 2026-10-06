import { Button } from "@cossplay/ui/components/button"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@cossplay/ui/components/tooltip"

export default function Particle() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>
        Hover me
      </TooltipTrigger>
      <TooltipPopup>Helpful hint</TooltipPopup>
    </Tooltip>
  )
}
