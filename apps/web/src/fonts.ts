import { clone, defaults, type Theme } from "@cossplay/core/coss"

/**
 * Faces registered by `@fontsource-variable/geist` and
 * `@fontsource-variable/geist-mono`, already imported from
 * `@cossplay/ui/globals.css`. Same stacks as that file's `--font-sans` and
 * `--font-mono`.
 */
export const geistSans =
  '"Geist Variable", ui-sans-serif, system-ui, sans-serif'
export const geistMono = '"Geist Mono Variable", ui-monospace, monospace'

const installed = new Map<string, string>([
  ["geist", '"Geist Variable"'],
  ["geist mono", '"Geist Mono Variable"'],
])

/**
 * Preset tokens say `Geist` / `Geist Mono`. The self-hosted files use the
 * variable family names. Serif is left as written: Geist has no serif face.
 */
export function installedStack(stack: string) {
  const parts = stack.split(",")
  const name = parts[0]?.replaceAll(/['"]/g, "").trim().toLowerCase() ?? ""
  const face = installed.get(name)
  if (!face) return stack
  return [face, ...parts.slice(1)].join(",")
}

/** coss ui's theme, with the website's sans and mono. Serif stays coss ui's. */
export function editorBaseline(): Theme {
  const theme = clone(defaults)
  for (const mode of ["light", "dark"] as const) {
    theme[mode]["font-sans"] = geistSans
    theme[mode]["font-mono"] = geistMono
  }
  return theme
}
