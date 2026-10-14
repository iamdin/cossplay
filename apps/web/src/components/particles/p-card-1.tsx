import { Button } from "@cossplay/ui/components/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@cossplay/ui/components/card"
import { Field, FieldLabel } from "@cossplay/ui/components/field"
import { Form } from "@cossplay/ui/components/form"
import { Input } from "@cossplay/ui/components/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@cossplay/ui/components/select"
import { CircleAlertIcon } from "lucide-react"

const frameworkOptions = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Remix", value: "remix" },
  { label: "Astro", value: "astro" },
]

export default function Particle() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardTitle>创建项目</CardTitle>
        <CardDescription>一键部署你的新项目。</CardDescription>
      </CardHeader>
      <CardPanel>
        <Form className="flex w-full flex-col gap-4">
          <Field>
            <FieldLabel>名称</FieldLabel>
            <Input placeholder="项目名称" type="text" />
          </Field>
          <Field>
            <FieldLabel>框架</FieldLabel>
            <Select defaultValue="next" items={frameworkOptions}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {frameworkOptions.map(({ label, value }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>
          <Button className="w-full" type="submit">
            部署
          </Button>
        </Form>
      </CardPanel>
      <CardFooter>
        <div className="flex gap-1 text-muted-foreground text-xs">
          <CircleAlertIcon className="size-3 h-lh shrink-0" />
          <p>这需要几秒钟。</p>
        </div>
      </CardFooter>
    </Card>
  )
}
