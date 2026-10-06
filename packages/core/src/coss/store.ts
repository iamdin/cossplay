import pLimit from "p-limit"
import { z } from "zod"
import type { ThemeOp } from "./messages"
import {
  coalesces,
  type Edit,
  fontsKey,
  type LastEdit,
  type LocalTheme,
  localThemesKey,
  newSite,
  readFonts,
  readLocalThemes,
  readSite,
  readTheme,
  type SiteState,
  siteKey,
  transition,
} from "./site"

// The subset of @wxt-dev/storage the store uses, so tests can pass an in-memory implementation.
export type KeyValue = {
  getItem(key: `local:${string}`): Promise<unknown>
  setItem(key: `local:${string}`, value: unknown): Promise<void>
}
const themeName = z
  .string("Theme name cannot be empty")
  .trim()
  .min(1, "Theme name cannot be empty")
  .transform((name) => name.slice(0, 100))
const httpOrigin = z
  .string("Invalid site origin")
  .regex(/^https?:\/\/[^/]+$/, "Invalid site origin")
const fontStylesheet = z.object(
  { family: z.string().min(1), css: z.string().max(500_000) },
  "Invalid font stylesheet"
)
const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value)
  if (!result.success) throw Error(result.error.issues[0]?.message)
  return result.data
}
// Owns every read-modify-write of extension storage. Operations run one at a time against
// the latest stored value, so callers send intents, never whole precomputed collections.
export function createStore(
  storage: KeyValue,
  afterSiteWrite: () => Promise<void> = async () => {}
) {
  const serialize = pLimit(1)
  const lastEdits = new Map<string, LastEdit>()
  return {
    edit(
      rawOrigin: string,
      edit: Edit,
      rawBaseline: unknown,
      key: string,
      now = Date.now()
    ): Promise<SiteState> {
      return serialize(async () => {
        const origin = parse(httpOrigin, rawOrigin),
          baseline = readTheme(rawBaseline)
        if (!baseline) throw Error("Invalid baseline theme")
        const state =
          readSite(await storage.getItem(siteKey(origin)), origin) ??
          newSite(origin)
        const coalesce = coalesces(
          lastEdits.get(origin) ?? null,
          key,
          state,
          now
        )
        const next = readSite(
          transition(state, edit, baseline, coalesce),
          origin
        )
        if (!next) throw Error("Unknown edit")
        await storage.setItem(siteKey(origin), next)
        lastEdits.set(origin, {
          key,
          at: now,
          current: JSON.stringify(next.current),
        })
        await afterSiteWrite()
        return next
      })
    },
    themes(op: ThemeOp, now = new Date()): Promise<LocalTheme[]> {
      return serialize(async () => {
        let themes = readLocalThemes(await storage.getItem(localThemesKey))
        if (op.kind === "add") {
          const theme = readTheme(op.theme)
          if (!theme) throw Error("Invalid theme")
          themes = [
            ...themes,
            {
              id: crypto.randomUUID(),
              name: parse(themeName, op.name),
              theme,
              createdAt: now.toISOString(),
            },
          ]
        } else if (op.kind === "rename")
          themes = themes.map((t) =>
            t.id === op.id ? { ...t, name: parse(themeName, op.name) } : t
          )
        else if (op.kind === "delete")
          themes = themes.filter((t) => t.id !== op.id)
        else throw Error("Unknown theme operation")
        await storage.setItem(localThemesKey, themes)
        return themes
      })
    },
    font(rawOrigin: string, family: unknown, css: unknown): Promise<void> {
      return serialize(async () => {
        const origin = parse(httpOrigin, rawOrigin),
          font = parse(fontStylesheet, { family, css })
        const fonts = readFonts(await storage.getItem(fontsKey(origin)))
        await storage.setItem(fontsKey(origin), {
          ...fonts,
          [font.family]: font.css,
        })
      })
    },
  }
}
