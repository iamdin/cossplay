import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: { contentScript: resolve(__dirname, "src/contentScript.ts") },
      output: {
        entryFileNames: "[name].js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
});
