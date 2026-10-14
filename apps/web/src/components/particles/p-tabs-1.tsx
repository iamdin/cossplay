import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@cossplay/ui/components/tabs"

export default function Particle() {
  return (
    <Tabs defaultValue="tab-1">
      <TabsList>
        <TabsTab value="tab-1">标签 1</TabsTab>
        <TabsTab value="tab-2">标签 2</TabsTab>
        <TabsTab value="tab-3">标签 3</TabsTab>
      </TabsList>
      <TabsPanel value="tab-1">
        <p className="p-4 text-center text-muted-foreground text-xs">
          标签 1 的内容
        </p>
      </TabsPanel>
      <TabsPanel value="tab-2">
        <p className="p-4 text-center text-muted-foreground text-xs">
          标签 2 的内容
        </p>
      </TabsPanel>
      <TabsPanel value="tab-3">
        <p className="p-4 text-center text-muted-foreground text-xs">
          标签 3 的内容
        </p>
      </TabsPanel>
    </Tabs>
  )
}
