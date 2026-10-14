import { Separator } from "@cossplay/ui/components/separator"

export default function Particle() {
  return (
    <div className="max-w-72">
      <div className="flex flex-col gap-1">
        <h4 className="font-medium text-sm">coss ui</h4>
        <p className="text-muted-foreground text-sm">
          无样式、可访问的基础组件，用来快速做产品界面和设计系统。
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex items-center gap-4 text-sm">
        <div>博客</div>
        <Separator orientation="vertical" />
        <div>文档</div>
        <Separator orientation="vertical" />
        <div>源码</div>
        <Separator orientation="vertical" />
        <div>发布</div>
      </div>
    </div>
  )
}
