import type { ComponentType } from "react"

type ParticleModule = { default: ComponentType }

// Whatever `shadcn add @coss/p-*` wrote into this folder.
const modules = import.meta.glob<ParticleModule>(
  "../components/particles/p-*.tsx",
  { eager: true }
)

function categoryOf(name: string) {
  const parts = name.split("-").slice(1)
  const last = parts.at(-1)
  if (last && /^\d+$/.test(last)) parts.pop()
  return parts.join(" ")
}

const particles = Object.entries(modules)
  .map(([path, mod]) => {
    const name =
      path
        .split("/")
        .pop()
        ?.replace(/\.tsx$/, "") ?? path
    return { name, category: categoryOf(name), Particle: mod.default }
  })
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

function Gallery({ categories }: { categories?: readonly string[] }) {
  const shown = categories
    ? particles.filter((particle) => categories.includes(particle.category))
    : particles
  const groups: [string, typeof particles][] = []
  for (const particle of shown) {
    const group = groups.find(([category]) => category === particle.category)
    if (group) group[1].push(particle)
    else groups.push([particle.category, [particle]])
  }
  return (
    <div className="space-y-8 px-4 pt-2 pb-6">
      {groups.map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {category}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
            {items.map(({ name, Particle }) => (
              <figure
                key={name}
                className="flex min-h-48 min-w-0 flex-col rounded-xl border bg-card"
              >
                <figcaption className="border-b px-4 py-2 font-mono text-muted-foreground text-xs">
                  {name}
                </figcaption>
                <div className="flex flex-1 items-center justify-center overflow-x-auto p-6">
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

export function Particles() {
  return <Gallery />
}

export function Cards() {
  return (
    <Gallery categories={["card", "empty", "meter", "table", "progress"]} />
  )
}

export function Forms() {
  return (
    <Gallery
      categories={[
        "input",
        "input group",
        "textarea",
        "select",
        "combobox",
        "checkbox",
        "radio group",
        "switch",
        "slider",
        "otp field",
        "field",
        "form",
        "kbd",
      ]}
    />
  )
}

export function Overlays() {
  return (
    <Gallery
      categories={[
        "dialog",
        "menu",
        "popover",
        "toast",
        "tooltip",
        "alert",
        "scroll area",
        "accordion",
        "tabs",
      ]}
    />
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
