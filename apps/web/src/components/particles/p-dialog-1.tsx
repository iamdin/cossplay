import { Button } from "@cossplay/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@cossplay/ui/components/dialog"
import { Field, FieldLabel } from "@cossplay/ui/components/field"
import { Form } from "@cossplay/ui/components/form"
import { Input } from "@cossplay/ui/components/input"

export default function Particle() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        打开对话框
      </DialogTrigger>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>编辑资料</DialogTitle>
          <DialogDescription>在这里修改资料。完成后点保存。</DialogDescription>
        </DialogHeader>
        <Form className="contents">
          <DialogPanel className="grid gap-4">
            <Field>
              <FieldLabel>姓名</FieldLabel>
              <Input defaultValue="林薇" type="text" />
            </Field>
            <Field>
              <FieldLabel>用户名</FieldLabel>
              <Input defaultValue="@lin.wei" type="text" />
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>取消</DialogClose>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  )
}
