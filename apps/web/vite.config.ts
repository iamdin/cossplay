import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Every page is prerendered to static HTML in dist/client; there is no server.
export default defineConfig({
  plugins: [tanstackStart({ prerender: { enabled: true } }), viteReact()],
})
