import type { ComponentType } from "react"
import Accordion from "@/components/particles/p-accordion-1"
import Alert from "@/components/particles/p-alert-1"
import Avatar from "@/components/particles/p-avatar-1"
import Badge from "@/components/particles/p-badge-1"
import Button from "@/components/particles/p-button-1"
import Card from "@/components/particles/p-card-1"
import Checkbox from "@/components/particles/p-checkbox-1"
import Dialog from "@/components/particles/p-dialog-1"
import Input from "@/components/particles/p-input-1"
import Menu from "@/components/particles/p-menu-1"
import Popover from "@/components/particles/p-popover-1"
import Progress from "@/components/particles/p-progress-1"
import RadioGroup from "@/components/particles/p-radio-group-1"
import Select from "@/components/particles/p-select-1"
import Separator from "@/components/particles/p-separator-1"
import Slider from "@/components/particles/p-slider-1"
import Switch from "@/components/particles/p-switch-1"
import Table from "@/components/particles/p-table-1"
import Tabs from "@/components/particles/p-tabs-1"
import Textarea from "@/components/particles/p-textarea-1"
import Toast from "@/components/particles/p-toast-1"
import Toggle from "@/components/particles/p-toggle-1"
import Tooltip from "@/components/particles/p-tooltip-1"

// 每种常见组件一个 coss ui particle，分组让每个颜色 token 都出现。
const groups: [string, [string, ComponentType][]][] = [
  [
    "操作",
    [
      ["按钮", Button],
      ["开关按钮", Toggle],
    ],
  ],
  [
    "表单",
    [
      ["输入框", Input],
      ["多行输入", Textarea],
      ["选择", Select],
      ["复选框", Checkbox],
      ["单选组", RadioGroup],
      ["开关", Switch],
      ["滑杆", Slider],
    ],
  ],
  [
    "展示",
    [
      ["卡片", Card],
      ["徽章", Badge],
      ["头像", Avatar],
      ["表格", Table],
      ["分隔线", Separator],
    ],
  ],
  [
    "反馈",
    [
      ["提示", Alert],
      ["进度", Progress],
      ["吐司", Toast],
    ],
  ],
  [
    "浮层",
    [
      ["对话框", Dialog],
      ["气泡", Popover],
      ["菜单", Menu],
      ["工具提示", Tooltip],
    ],
  ],
  [
    "导航",
    [
      ["标签页", Tabs],
      ["手风琴", Accordion],
    ],
  ],
]

export function Components() {
  return (
    <div className="space-y-8 px-4 pt-2 pb-6">
      {groups.map(([group, items]) => (
        <section key={group}>
          <h2 className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {group}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-4">
            {items.map(([name, Particle]) => (
              <figure
                key={name}
                className="flex min-h-48 flex-col rounded-xl border bg-card"
              >
                <figcaption className="border-b px-4 py-2 text-muted-foreground text-xs">
                  {name}
                </figcaption>
                <div className="flex flex-1 items-center justify-center p-6">
                  <Particle />
                </div>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function Typography() {
  return (
    <article className="mx-auto max-w-2xl space-y-5 p-6 text-foreground">
      <p className="text-muted-foreground text-sm">排版</p>
      <h1 className="font-heading font-semibold text-4xl tracking-tight">
        永字八法，天地玄黄
      </h1>
      <p className="text-lg text-muted-foreground">
        主题不只是颜色：字体族、字距和圆角决定每个组件读起来的样子。
      </p>
      <h2 className="font-heading font-semibold text-2xl tracking-tight">
        无衬线、衬线与等宽
      </h2>
      <p>
        正文使用 <code>font-sans</code>。在面板里选一种 Google
        字体，这里会立刻加载。链接
        <a href="#typography" className="text-primary underline">
          长这样
        </a>
        ，<strong>加粗文字</strong>会更突出。
      </p>
      <p className="font-serif">这一段用衬线字体，适合编辑页和长文阅读。</p>
      <blockquote className="border-l-2 pl-4 text-muted-foreground italic">
        “让你的 coss ui 站点换身装。”
      </blockquote>
      <ul className="list-disc space-y-1 pl-6">
        <li>标题和正文共用字距 token。</li>
        <li>
          行内 <code className="rounded bg-muted px-1 font-mono">代码</code>{" "}
          使用等宽字体。
        </li>
        <li>代码块使用 code 颜色。</li>
      </ul>
      <pre className="overflow-x-auto rounded-lg border bg-code p-4 font-mono text-code-foreground text-sm">
        <code>
          {`export function Button() {
  return <button className="bg-primary">保存</button>
}`}
        </code>
      </pre>
    </article>
  )
}
