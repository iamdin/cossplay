import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/background.ts"),
      name: "background",
      fileName: () => "background.js",
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "background.js",
      },
    },
  },
})
