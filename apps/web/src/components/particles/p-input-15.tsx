import { Input } from "@cossplay/ui/components/input"

export default function Particle() {
  return (
    <Input
      aria-label="Email"
      className="border-transparent bg-muted shadow-none before:hidden"
      placeholder="Email"
      type="email"
    />
  )
}
