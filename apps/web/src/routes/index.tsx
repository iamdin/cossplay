import { createFileRoute } from "@tanstack/react-router"
import styles from "../styles.css?url"

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cossplay — live themes for coss ui sites" },
      {
        name: "description",
        content:
          "A Chrome side panel that live-edits the theme of any coss ui website: 42 tweakcn presets, colors, fonts, radius and contrast checks, exported as Tailwind CSS.",
      },
      { property: "og:title", content: "Cossplay" },
      {
        property: "og:description",
        content:
          "Live-edit the theme of any coss ui website from Chrome's side panel.",
      },
      { property: "og:image", content: "/screenshot.webp" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap",
      },
      { rel: "stylesheet", href: styles },
    ],
  }),
  component: Landing,
})

const features = [
  {
    head: (
      <div className="swatches">
        {["#1e9df1", "#a3004c", "#c96442", "#7c3aed"].map((background) => (
          <span key={background} style={{ background }} />
        ))}
      </div>
    ),
    title: "42 tweakcn presets",
    body: "Apply any tweakcn theme to a coss ui page. Colors are mapped onto coss semantics, so destructive text and code blocks stay readable.",
  },
  {
    head: <span className="icon">#1e9df1 · oklch · hsl</span>,
    title: "Precise color editing",
    body: "Grouped tokens with search, HEX / OKLCH / HSL / RGB input, channel sliders and opacity, written back in the site's own format.",
  },
  {
    head: <span className="icon">Aa · 0.625rem</span>,
    title: "Type and geometry",
    body: "Google font search and loading, letter spacing, radius, spacing and shadows, shared across light and dark.",
  },
  {
    head: <span className="icon">4.5:1 AA</span>,
    title: "Contrast checks",
    body: "WCAG ratios for 15 coss color pairs, with an issues-only view while you edit.",
  },
  {
    head: <span className="icon">⌘Z · ⌘⇧Z</span>,
    title: "Undo everything",
    body: "Every edit is in history. Reset to a preset or back to the site's original theme at any time.",
  },
  {
    head: <span className="icon">local only</span>,
    title: "No account, no server",
    body: "Themes are saved per site in your browser and restored before first paint on reload.",
  },
]

const formats = [
  "Tailwind v4 · OKLCH CSS",
  "Tailwind v3 · HSL CSS",
  "shadcn registry JSON",
  "Light / dark token JSON",
  "tailwind.config.js",
  "Next.js font layout",
]

const addToChrome = (
  <span className="btn soon" aria-disabled="true">
    Add to Chrome <small>Coming soon</small>
  </span>
)

function Landing() {
  return (
    <div className="wrap">
      <nav>
        <a className="logo" href="/">
          <i />
          Cossplay
        </a>
        <div className="links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#export">Export</a>
          <a href="/editor">Editor</a>
        </div>
      </nav>

      <header>
        <span className="eyebrow">
          <b />
          Chrome extension · runs locally
        </span>
        <h1>Re-theme any coss ui site, live.</h1>
        <p className="lede">
          Cossplay docks next to the page and edits its theme variables while
          you watch. Try a tweakcn preset, tune colors, fonts and radius, then
          export the result as Tailwind CSS.
        </p>
        <div className="ctas">
          <a className="btn primary" href="/editor">
            Open the editor
          </a>
          {addToChrome}
        </div>
        <div className="shot">
          <img
            src="/screenshot.webp"
            width="1500"
            height="864"
            alt="coss.com/ui themed with the Violet Bloom preset, with the Cossplay side panel open on the color editor"
          />
        </div>
      </header>

      <section id="features">
        <h2>Everything a theme needs</h2>
        <p className="sub">
          Built on coss ui's own token set, including the info, success, warning
          and code colors that shadcn themes don't have.
        </p>
        <div className="grid">
          {features.map((f) => (
            <div className="card" key={f.title}>
              {f.head}
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how">
        <h2>How it works</h2>
        <p className="sub">
          Cossplay only overrides the variables you change. Everything else
          keeps following the site.
        </p>
        <ol className="steps">
          <li>
            <h3>Open a coss ui site</h3>
            <p>
              The extension reads the page's theme variables from{" "}
              <code>:root</code>, <code>.dark</code> and <code>@theme</code>.
            </p>
          </li>
          <li>
            <h3>Edit in the side panel</h3>
            <p>
              Pick a preset or tweak tokens. The page updates instantly in light
              or dark.
            </p>
          </li>
          <li>
            <h3>Export the code</h3>
            <p>
              Copy or download CSS shaped like coss ui's{" "}
              <code>globals.css</code>, ready to paste into your project.
            </p>
          </li>
        </ol>
      </section>

      <section id="export">
        <h2>Export to your stack</h2>
        <p className="sub">
          Import from a tweakcn or registry URL, pasted CSS or JSON, then take
          it anywhere.
        </p>
        <div className="formats">
          {formats.map((format) => (
            <code key={format}>{format}</code>
          ))}
        </div>
      </section>

      <div className="closing">
        <h2>Let your coss ui site play dress-up.</h2>
        <p>
          Cossplay is free and runs entirely in your browser. Chrome Web Store
          listing coming soon.
        </p>
        <div className="ctas">
          <a className="btn primary" href="/editor">
            Open the editor
          </a>
          {addToChrome}
        </div>
      </div>

      <footer>
        <span>© 2026 Cossplay</span>
        <span>
          Presets from <a href="https://github.com/jnsahaj/tweakcn">tweakcn</a>{" "}
          (Apache-2.0). Not affiliated with coss, Cal.com, tweakcn or shadcn/ui.
        </span>
      </footer>
    </div>
  )
}
