import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@cossplay/ui/components/input-group"
import { SearchIcon } from "lucide-react"

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput aria-label="Search" placeholder="Search" type="search" />
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
    </InputGroup>
  )
}
