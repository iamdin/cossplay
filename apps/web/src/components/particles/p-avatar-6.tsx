import { Avatar, AvatarFallback } from "@cossplay/ui/components/avatar"
import { UserIcon } from "lucide-react"

export default function Particle() {
  return (
    <Avatar>
      <AvatarFallback>
        <UserIcon className="size-4" />
      </AvatarFallback>
    </Avatar>
  )
}
