import { createFileRoute } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { Footer, Logo } from "@/landing/chrome"
import styles from "@/styles/landing.css?url"

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy · Cossplay" },
      {
        name: "description",
        content:
          "Cossplay's privacy policy: no accounts, no data collection, themes stay in your browser.",
      },
    ],
    links: [{ rel: "stylesheet", href: styles }],
  }),
  component: Privacy,
})

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-semibold text-lg">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

function Privacy() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b">
        <nav className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
          <Logo />
        </nav>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-semibold text-3xl tracking-tight">Privacy</h1>
        <p className="mt-3 text-muted-foreground">
          Last updated October 7, 2026
        </p>
        <p className="mt-6">
          Cossplay has no accounts and no server of its own. It does not
          collect, sell or share personal data.
        </p>

        <Part title="Chrome extension">
          <p>
            The extension reads the CSS theme variables of the page you open it
            on, so it can show and edit them, and writes your edited variables
            back into that page. This happens locally in your browser.
          </p>
          <p>
            Your themes, edit history and loaded fonts are saved per website in
            Chrome's extension storage on your device. They are never sent
            anywhere. Uninstalling the extension deletes them.
          </p>
          <p>
            To read a page's theme, the extension may download that page's own
            stylesheets, including ones served from another domain, without
            cookies. Otherwise it makes network requests only when you ask:
            Google Fonts when you load a font, and the URL you enter when you
            import a theme. It has no analytics or tracking.
          </p>
        </Part>

        <Part title="Website and web editor">
          <p>
            The editor at cossplay.vercel.app saves your theme in your browser's
            local storage. Loading a font requests its stylesheet from Google
            Fonts; importing from a URL fetches that URL.
          </p>
          <p>
            The website uses Vercel Web Analytics to count page views. It uses
            no cookies and does not identify individual visitors.
          </p>
          <p>
            The bridge script you can add to your own app only exchanges theme
            CSS with the Cossplay editor when your app is open in the editor's
            custom preview. It sends nothing elsewhere.
          </p>
        </Part>

        <Part title="Contact">
          <p>
            Questions about privacy: email the developer address listed on
            Cossplay's Chrome Web Store page.
          </p>
        </Part>
      </main>
      <Footer />
    </div>
  )
}
