import { defineConfig } from "bumpp"

export default defineConfig({
  files: ["apps/extension/package.json"],
  tag: "v%s",
  push: true,
})
