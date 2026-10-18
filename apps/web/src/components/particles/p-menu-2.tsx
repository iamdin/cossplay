import { Button } from "@cossplay/ui/components/button"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@cossplay/ui/components/menu"

export default function Particle() {
  return (
    <Menu>
      <MenuTrigger openOnHover render={<Button variant="outline" />}>
        Hover me
      </MenuTrigger>
      <MenuPopup>
        <MenuItem>Item one</MenuItem>
        <MenuItem>Item two</MenuItem>
      </MenuPopup>
    </Menu>
  )
}
