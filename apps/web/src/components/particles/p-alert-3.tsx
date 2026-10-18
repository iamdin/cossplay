import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@cossplay/ui/components/alert"
import { Button } from "@cossplay/ui/components/button"
import { InfoIcon } from "lucide-react"

export default function Particle() {
  return (
    <Alert>
      <InfoIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        Describe what can be done about it here.
      </AlertDescription>
      <AlertAction>
        <Button size="xs" variant="ghost">
          Dismiss
        </Button>
        <Button size="xs">Ok</Button>
      </AlertAction>
    </Alert>
  )
}
