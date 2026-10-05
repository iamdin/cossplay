import { crx } from "@crxjs/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import manifest from "./manifest.json"

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  build: { rollupOptions: { input: { sidepanel: "sidepanel.html" } } },
})
