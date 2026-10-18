import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@cossplay/ui/components/alert"
import { InfoIcon } from "lucide-react"

export default function Particle() {
  return (
    <Alert>
      <InfoIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        Describe what can be done about it here.
      </AlertDescription>
    </Alert>
  )
}
