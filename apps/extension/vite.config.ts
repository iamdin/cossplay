import { crx } from "@crxjs/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import manifest from "./manifest.json"
import pkg from "./package.json"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest: { ...manifest, version: pkg.version } }),
  ],
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  build: { rollupOptions: { input: { sidepanel: "sidepanel.html" } } },
})
