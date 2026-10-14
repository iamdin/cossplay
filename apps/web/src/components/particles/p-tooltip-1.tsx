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
        悬停看看
      </TooltipTrigger>
      <TooltipPopup>有用的提示</TooltipPopup>
    </Tooltip>
  )
}
