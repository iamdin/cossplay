import { defineConfig } from "bumpp"

export default defineConfig({
  files: [
    "package.json",
    "apps/extension/package.json",
    "packages/*/package.json",
    "tooling/typescript/package.json",
  ],
  tag: false,
  push: false,
})
