import pLimit from "p-limit"
import { z } from "zod"
import {
  coalesces,
  type Edit,
  fontsKey,
  type LastEdit,
  newSite,
  readFonts,
  readSite,
  readTheme,
  type SiteState,
  siteKey,
  transition,
} from "./site"

// store 用到的 @wxt-dev/storage 子集，测试可以传入内存实现。
export type KeyValue = {
  getItem(key: `local:${string}`): Promise<unknown>
  setItem(key: `local:${string}`, value: unknown): Promise<void>
}
const httpOrigin = z
  .string("站点来源无效")
  .regex(/^https?:\/\/[^/]+$/, "站点来源无效")
const fontStylesheet = z.object(
  { family: z.string().min(1), css: z.string().max(500_000) },
  "字体样式表无效"
)
const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value)
  if (!result.success) throw Error(result.error.issues[0]?.message)
  return result.data
}
// 独占扩展存储的每一次读改写。操作对着最新存储值逐个执行，调用方只发意图，不发预先算好的整包。
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
        if (!baseline) throw Error("基线主题无效")
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
        if (!next) throw Error("未知编辑")
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
