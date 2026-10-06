// Run against the documented local upstream clone, never a moving remote URL.

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import vm from "node:vm"
import ts from "typescript"

const root = process.argv[2] ?? "/tmp/github.com/jnsahaj/tweakcn"
const hash = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim()
if (hash !== "a3b47b37cba97dd637de517aab52c45ec0f83456")
  throw Error("Use the frozen reference revision")
function extract(file) {
  const source = fs.readFileSync(`${root}/${file}`, "utf8")
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const exports = {}
  vm.runInNewContext(output, { exports, window: undefined })
  return exports
}
const config = extract("config/theme.ts"),
  presets = extract("utils/theme-presets.ts")
const source = fs.readFileSync(
  `${root}/components/editor/hsl-adjustment-controls.tsx`,
  "utf8"
)
const adjustmentSource = source.slice(
  source.indexOf("const HSL_PRESETS = ") + "const HSL_PRESETS = ".length,
  source.indexOf("];", source.indexOf("const HSL_PRESETS = ")) + 1
)
const hslPresets = vm.runInNewContext(adjustmentSource)
const colors = Object.keys(config.defaultLightThemeStyles).filter(
  (k) => !config.COMMON_STYLES.includes(k)
)
const result = {
  revision: hash,
  source: "https://github.com/jnsahaj/tweakcn",
  defaults: {
    light: config.defaultLightThemeStyles,
    dark: config.defaultDarkThemeStyles,
  },
  common: config.COMMON_STYLES,
  colors,
  presets: presets.defaultPresets,
  hslPresets,
}

fs.writeFileSync(
  new URL("../src/coss/tweakcn.json", import.meta.url),
  `${JSON.stringify(result, null, 2)}\n`
)

fs.copyFileSync(
  `${root}/LICENSE`,
  new URL("../../../licenses/tweakcn.txt", import.meta.url)
)
console.log({
  revision: hash,
  fields: Object.keys(result.defaults.light).length,
  presets: Object.keys(result.presets).length,
  hslPresets: hslPresets.length,
})
