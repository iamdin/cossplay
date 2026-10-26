import type { ComponentType } from "react"

type ParticleModule = { default: ComponentType }

// Whatever `shadcn add @coss/p-*` wrote into this folder.
const modules = import.meta.glob<ParticleModule>(
  "../components/particles/p-*.tsx",
  { eager: true }
)

// Registry files are `p-<name>-<number>`. Anything else is not a particle type.
function categoryOf(name: string) {
  const match = /^p-(.+)-\d+$/.exec(name)
  return match?.[1]?.replaceAll("-", " ") ?? null
}

function titleCase(category: string) {
  return category.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

type ParticleItem = { name: string; Particle: ComponentType }

export type ParticleCategory = {
  id: string
  label: string
  items: ParticleItem[]
}

const grouped = new Map<string, ParticleItem[]>()
for (const [path, mod] of Object.entries(modules).sort(([a], [b]) =>
  (a.split("/").pop() ?? a).localeCompare(b.split("/").pop() ?? b, undefined, {
    numeric: true,
  })
)) {
  const name = path
    .split("/")
    .pop()
    ?.replace(/\.tsx$/, "")
  const id = name ? categoryOf(name) : null
  if (!name || !id) continue
  const items = grouped.get(id) ?? []
  items.push({ name, Particle: mod.default })
  grouped.set(id, items)
}

export const particleCategories: ParticleCategory[] = [...grouped].map(
  ([id, items]) => ({ id, label: titleCase(id), items })
)

export function ParticleGallery({ category }: { category: string }) {
  const items = particleCategories.find((group) => group.id === category)?.items
  if (!items) return null
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4 px-4 pt-2 pb-6">
      {items.map(({ name, Particle }) => (
        <figure
          key={name}
          className="flex min-h-48 min-w-0 flex-col rounded-xl border bg-card"
        >
          <figcaption className="border-b px-4 py-2 font-mono text-xs text-muted-foreground">
            {name}
          </figcaption>
          <div className="flex flex-1 items-center justify-center overflow-x-auto p-6">
            <Particle />
          </div>
        </figure>
      ))}
    </div>
  )
}

export function Typography() {
  return (
    <article className="mx-auto max-w-2xl space-y-5 p-6 text-foreground">
      <p className="text-sm text-muted-foreground">Typography</p>
      <h1 className="font-heading text-4xl font-semibold tracking-tight">
        The quick brown fox jumps over the lazy dog
      </h1>
      <p className="text-lg text-muted-foreground">
        A theme is more than colors: font families, letter spacing and radius
        shape how every component reads.
      </p>
      <h2 className="font-heading text-2xl font-semibold tracking-tight">
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
      <pre className="overflow-x-auto rounded-lg border bg-code p-4 font-mono text-sm text-code-foreground">
        <code>
          {`export function Button() {
  return <button className="bg-primary">Save</button>
}`}
        </code>
      </pre>
    </article>
  )
}
