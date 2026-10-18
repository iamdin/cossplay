import { Button } from "@cossplay/ui/components/button"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@cossplay/ui/components/menu"

export default function Particle() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuItem>Item one</MenuItem>
        <MenuSub>
          <MenuSubTrigger>More</MenuSubTrigger>
          <MenuSubPopup>
            <MenuItem>Sub item A</MenuItem>
            <MenuItem>Sub item B</MenuItem>
          </MenuSubPopup>
        </MenuSub>
        <MenuItem>Item two</MenuItem>
      </MenuPopup>
    </Menu>
  )
}
