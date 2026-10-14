import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@cossplay/ui/components/accordion"

export default function Particle() {
  const items = [
    {
      content:
        "Base UI 是一套高质量、无样式的 React 组件，用来做设计系统和网页应用。",
      id: "1",
      title: "Base UI 是什么？",
    },
    {
      content: "去文档里的「快速开始」。如果你用过无样式组件库，会觉得很熟悉。",
      id: "2",
      title: "怎么开始？",
    },
    {
      content: "当然。Base UI 免费且开源。",
      id: "3",
      title: "能用在我的项目里吗？",
    },
  ]

  return (
    <Accordion className="w-full" defaultValue={["3"]}>
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionPanel>{item.content}</AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
