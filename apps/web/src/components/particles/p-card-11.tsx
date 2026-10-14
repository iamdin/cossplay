import { Button } from "@cossplay/ui/components/button"
import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@cossplay/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@cossplay/ui/components/empty"
import { FolderIcon, PlusIcon } from "lucide-react"

export default function Particle() {
  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>项目</CardFrameTitle>
        <CardFrameDescription>管理你的项目</CardFrameDescription>
        <CardFrameAction>
          <Button variant="outline">
            <PlusIcon />
            添加
          </Button>
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderIcon />
              </EmptyMedia>
              <EmptyTitle>还没有项目</EmptyTitle>
              <EmptyDescription>添加第一个项目来开始。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
