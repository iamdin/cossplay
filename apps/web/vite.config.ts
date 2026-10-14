import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig, type Plugin, runnerImport } from "vite"

// shadcn 注册表（/r/themes/<preset>.json 和 registry.json），由预设生成。
const registry: Plugin = {
  name: "cossplay-registry",
  applyToEnvironment: (environment) => environment.name === "client",
  async generateBundle() {
    // Vite 的配置加载器不能导入 core 里无扩展名的 TypeScript；模块运行器可以。
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

// 每个页面都预渲染成 dist/client 里的静态 HTML，没有服务器。
export default defineConfig({
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  plugins: [
    tailwindcss(),
    tanstackStart({ prerender: { enabled: true, crawlLinks: false } }),
    viteReact(),
    registry,
  ],
})
