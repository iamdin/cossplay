import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../../chrome-extension/dist/side-panel"),
    // outDir 在本包根目录之外,Vite 默认不清空,导致旧的 hash bundle 越积越多。
    // 显式开启:只清空 side-panel 子目录,不会触及同级的 dist/contentScript.js、
    // background.js、manifest.json、icons(它们由 chrome-extension 单独构建)。
    emptyOutDir: true,
  }
})
