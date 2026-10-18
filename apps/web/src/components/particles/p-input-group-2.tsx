import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@cossplay/ui/components/input-group"
import { MailIcon } from "lucide-react"

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput aria-label="Email" placeholder="Email" type="email" />
      <InputGroupAddon align="inline-end">
        <MailIcon aria-hidden="true" />
      </InputGroupAddon>
    </InputGroup>
  )
}
