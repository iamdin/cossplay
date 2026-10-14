import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@cossplay/ui/components/alert"

export default function Particle() {
  return (
    <Alert>
      <AlertTitle>注意</AlertTitle>
      <AlertDescription>
        <p>在这里说明可以怎么处理。</p>
      </AlertDescription>
    </Alert>
  )
}
