import path from "path"
import { defineConfig } from "vitest/config"

// 仅用于单元测试：复用 vite 的 `@` 别名；theme-core 经 workspace 软链解析。
export default defineConfig({
  test: { environment: "jsdom", globals: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
