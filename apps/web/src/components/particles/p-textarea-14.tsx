import { Button } from "@cossplay/ui/components/button"
import { Textarea } from "@cossplay/ui/components/textarea"

export default function Particle() {
  return (
    <div className="flex flex-col gap-2">
      <Textarea placeholder="Type your message here" />
      <Button className="self-end">Send</Button>
    </div>
  )
}
