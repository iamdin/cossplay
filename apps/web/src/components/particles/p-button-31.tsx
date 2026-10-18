import { Button } from "@cossplay/ui/components/button"
import { Kbd, KbdGroup } from "@cossplay/ui/components/kbd"
import { PrinterIcon } from "lucide-react"

export default function Particle() {
  return (
    <Button variant="outline">
      <PrinterIcon aria-hidden="true" />
      Print
      <KbdGroup className="-me-1">
        <Kbd>&#8984;</Kbd>
        <Kbd>P</Kbd>
      </KbdGroup>
    </Button>
  )
}
