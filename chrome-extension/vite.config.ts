import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background.ts"),
        "content-script": resolve(__dirname, "src/content-script.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        format: "es",
      },
    },
  },
})
