import { Button } from "@cossplay/ui/components/button"
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@cossplay/ui/components/menu"
import {
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  TrashIcon,
} from "lucide-react"

export default function Particle() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>打开菜单</MenuTrigger>
      <MenuPopup>
        <MenuGroup>
          <MenuGroupLabel>播放</MenuGroupLabel>
          <MenuItem>
            <PlayIcon aria-hidden="true" />
            播放
            <MenuShortcut>⌘P</MenuShortcut>
          </MenuItem>
          <MenuItem disabled>
            <PauseIcon aria-hidden="true" />
            暂停
            <MenuShortcut>⇧⌘P</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <SkipBackIcon aria-hidden="true" />
            上一首
            <MenuShortcut>⌘[</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <SkipForwardIcon aria-hidden="true" />
            下一首
            <MenuShortcut>⌘]</MenuShortcut>
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuCheckboxItem>随机</MenuCheckboxItem>
        <MenuCheckboxItem>重复</MenuCheckboxItem>
        <MenuCheckboxItem disabled>增强音效</MenuCheckboxItem>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>排序</MenuGroupLabel>
          <MenuRadioGroup>
            <MenuRadioItem value="artist">艺人</MenuRadioItem>
            <MenuRadioItem value="album">专辑</MenuRadioItem>
            <MenuRadioItem value="title">标题</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
        <MenuSeparator />
        <MenuCheckboxItem variant="switch">自动保存</MenuCheckboxItem>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>加入播放列表</MenuSubTrigger>
          <MenuSubPopup>
            <MenuItem>爵士</MenuItem>
            <MenuSub>
              <MenuSubTrigger>摇滚</MenuSubTrigger>
              <MenuSubPopup>
                <MenuItem>硬摇滚</MenuItem>
                <MenuItem>轻摇滚</MenuItem>
                <MenuItem>经典摇滚</MenuItem>
                <MenuSeparator />
                <MenuItem>金属</MenuItem>
                <MenuItem>朋克</MenuItem>
                <MenuItem>垃圾摇滚</MenuItem>
                <MenuItem>另类</MenuItem>
                <MenuItem>独立</MenuItem>
                <MenuItem>电子</MenuItem>
              </MenuSubPopup>
            </MenuSub>
            <MenuItem>流行</MenuItem>
          </MenuSubPopup>
        </MenuSub>
        <MenuSeparator />
        <MenuItem variant="destructive">
          <TrashIcon aria-hidden="true" />
          删除
          <MenuShortcut>⌘⌫</MenuShortcut>
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}
