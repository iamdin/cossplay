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
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuItem closeOnClick>Profile</MenuItem>
        <MenuItem closeOnClick>Settings</MenuItem>
        <MenuItem closeOnClick>Log out</MenuItem>
      </MenuPopup>
    </Menu>
  )
}
