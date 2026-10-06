import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router"
import type { ReactNode } from "react"
import styles from "../styles.css?url"

const icon =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23171717'/><circle cx='16' cy='16' r='7' fill='none' stroke='%23fafafa' stroke-width='3'/></svg>"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
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
      { rel: "icon", href: icon },
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
  component: Outlet,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
