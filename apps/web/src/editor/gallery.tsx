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

// One coss ui particle per common component, grouped so every color token shows up somewhere.
const groups: [string, [string, ComponentType][]][] = [
  [
    "Actions",
    [
      ["Button", Button],
      ["Toggle", Toggle],
    ],
  ],
  [
    "Forms",
    [
      ["Input", Input],
      ["Textarea", Textarea],
      ["Select", Select],
      ["Checkbox", Checkbox],
      ["Radio Group", RadioGroup],
      ["Switch", Switch],
      ["Slider", Slider],
    ],
  ],
  [
    "Display",
    [
      ["Card", Card],
      ["Badge", Badge],
      ["Avatar", Avatar],
      ["Table", Table],
      ["Separator", Separator],
    ],
  ],
  [
    "Feedback",
    [
      ["Alert", Alert],
      ["Progress", Progress],
      ["Toast", Toast],
    ],
  ],
  [
    "Overlays",
    [
      ["Dialog", Dialog],
      ["Popover", Popover],
      ["Menu", Menu],
      ["Tooltip", Tooltip],
    ],
  ],
  [
    "Navigation",
    [
      ["Tabs", Tabs],
      ["Accordion", Accordion],
    ],
  ],
]

export function Components() {
  return (
    <div className="space-y-10 p-6">
      {groups.map(([group, items]) => (
        <section key={group}>
          <h2 className="mb-3 font-medium text-muted-foreground text-sm">
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
      <p className="text-muted-foreground text-sm">Typography</p>
      <h1 className="font-heading font-semibold text-4xl tracking-tight">
        The quick brown fox jumps over the lazy dog
      </h1>
      <p className="text-lg text-muted-foreground">
        A theme is more than colors: font families, letter spacing and radius
        shape how every component reads.
      </p>
      <h2 className="font-heading font-semibold text-2xl tracking-tight">
        Sans, serif and mono
      </h2>
      <p>
        Body text uses <code>font-sans</code>. Pick a Google font in the panel
        and it loads here immediately. Links look{" "}
        <a href="#typography" className="text-primary underline">
          like this
        </a>
        , and <strong>strong text</strong> stands out.
      </p>
      <p className="font-serif">
        This paragraph uses the serif font, for editorial pages and long-form
        reading.
      </p>
      <blockquote className="border-l-2 pl-4 text-muted-foreground italic">
        “Let your coss ui site play dress-up.”
      </blockquote>
      <ul className="list-disc space-y-1 pl-6">
        <li>Headings and body share the letter spacing token.</li>
        <li>
          Inline <code className="rounded bg-muted px-1 font-mono">code</code>{" "}
          uses the mono font.
        </li>
        <li>Code blocks use the code colors.</li>
      </ul>
      <pre className="overflow-x-auto rounded-lg border bg-code p-4 font-mono text-code-foreground text-sm">
        <code>
          {`export function Button() {
  return <button className="bg-primary">Save</button>
}`}
        </code>
      </pre>
    </article>
  )
}
