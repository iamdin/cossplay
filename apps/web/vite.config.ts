import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig, type Plugin, runnerImport } from "vite"

// The shadcn registry (/r/themes/<preset>.json and registry.json), generated from the presets.
const registry: Plugin = {
  name: "cossplay-registry",
  applyToEnvironment: (environment) => environment.name === "client",
  async generateBundle() {
    // Vite's config loader can't import core's extensionless TypeScript; a module runner can.
    const { module } = await runnerImport<typeof import("@cossplay/core/coss")>(
      "@cossplay/core/coss"
    )
    const { items, index } = module.presetRegistry()
    for (const [name, source] of [
      ...items.map((item) => [item.name, item] as const),
      ["registry", index] as const,
    ])
      this.emitFile({
        type: "asset",
        fileName: `r/themes/${name}.json`,
        source: JSON.stringify(source, null, 2),
      })
  },
}

// Every page is prerendered to static HTML in dist/client; there is no server.
export default defineConfig({
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  // Prerender fetches this preview server. On the CI runner, `localhost` can
  // resolve to ::1 (the connect times out) while nothing is listening on
  // 127.0.0.1, so the crawl fails before any page is written.
  preview: { host: "127.0.0.1" },
  plugins: [
    tailwindcss(),
    tanstackStart({ prerender: { enabled: true, crawlLinks: false } }),
    viteReact(),
    registry,
  ],
})
