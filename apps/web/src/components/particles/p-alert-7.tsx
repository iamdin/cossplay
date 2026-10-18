import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@cossplay/ui/components/alert"
import { CircleAlertIcon } from "lucide-react"

export default function Particle() {
  return (
    <Alert variant="error">
      <CircleAlertIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        Describe what can be done about it here.
      </AlertDescription>
    </Alert>
  )
}
