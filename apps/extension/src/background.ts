import { createStore, readSite, worker } from "@cossplay/core/coss"
import { storage } from "@wxt-dev/storage"

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)
chrome.storage.local
  .setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" })
  .catch(console.error)

async function fetchText(raw: string) {
  const url = new URL(raw)
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw Error("只允许不带凭据的 HTTP(S) 地址")
  const response = await fetch(url, {
    credentials: "omit",
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw Error(`拉取失败：HTTP ${response.status}`)
  if (Number(response.headers.get("content-length")) > 2_000_000)
    throw Error("主题或样式表太大")
  const text = await response.text()
  if (text.length > 2_000_000) throw Error("主题或样式表太大")
  return text
}
async function syncEarlyScripts() {
  const stored = await storage.snapshot("local")
  const desired = Object.entries(stored)
    .filter(([key]) => key.startsWith("site:"))
    .map(([key, value]) => readSite(value, key.slice("site:".length)))
    .filter(
      (state) =>
        state?.enabled &&
        (state.previewMode ||
          Object.values(state.current.overrides).some(
            (v) => Object.keys(v).length
          ))
    )
    .map((state) => state!.origin)
  const existing = await chrome.scripting.getRegisteredContentScripts()
  const origins = [...new Set(desired)].sort()
  const scripts = origins.map((origin) => ({
    id: `cossplay-${Array.from(new TextEncoder().encode(origin))
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")}`,
    matches: [`${origin}/*`],
    js: ["early.js"],
    runAt: "document_start" as const,
    persistAcrossSessions: true,
  }))
  const ids = new Set(scripts.map((s) => s.id))
  const obsolete = existing
    .filter((s) => s.id.startsWith("cossplay-") && !ids.has(s.id))
    .map((s) => s.id)
  if (obsolete.length)
    await chrome.scripting.unregisterContentScripts({ ids: obsolete })
  const known = new Set(existing.map((s) => s.id))
  const added = scripts.filter((s) => !known.has(s.id))
  if (added.length) await chrome.scripting.registerContentScripts(added)
}
const store = createStore(storage, syncEarlyScripts)
type Sender = chrome.runtime.MessageSender
// 只有扩展页面能改偏好；content script 可以读存储，但不能写。
function trusted(sender: Sender) {
  if (sender.tab && !sender.url?.startsWith(chrome.runtime.getURL("")))
    throw Error("发送方不可信")
}
worker.onMessage("fetch", async ({ data }) => {
  if (typeof data.url !== "string") throw Error("URL 无效")
  return { text: await fetchText(data.url) }
})
worker.onMessage("css", async ({ data, sender }) => {
  if (sender.tab?.id === undefined) throw Error("CSS 请求必须来自标签页")
  if (
    typeof data.css !== "string" ||
    typeof data.previous !== "string" ||
    data.css.length > 1_000_000 ||
    data.previous.length > 1_000_000
  )
    throw Error("注入的 CSS 无效")
  const target = sender.documentId
    ? { tabId: sender.tab.id, documentIds: [sender.documentId] }
    : { tabId: sender.tab.id, frameIds: [sender.frameId ?? 0] }
  // 上一张样式表由 content script 提供，worker 挂起之后也一样。
  // 先插入再移除，失败时留下的正好是上一张。
  if (data.css)
    await chrome.scripting.insertCSS({ target, css: data.css, origin: "USER" })
  if (data.previous)
    try {
      await chrome.scripting.removeCSS({
        target,
        css: data.previous,
        origin: "USER",
      })
    } catch (error) {
      if (data.css)
        await chrome.scripting
          .removeCSS({ target, css: data.css, origin: "USER" })
          .catch(console.error)
      throw error
    }
})
worker.onMessage("detected", async ({ data, sender }) => {
  if (sender.tab?.id === undefined) throw Error("检测结果必须来自标签页")
  const tabId = sender.tab.id,
    detected = data.detected === true
  await chrome.action.setBadgeText({ tabId, text: detected ? "✓" : "—" })
  await chrome.action.setTitle({
    tabId,
    title: detected
      ? "Cossplay — 已检测到主题变量"
      : "Cossplay — 未检测到主题变量",
  })
  await chrome.action.setBadgeBackgroundColor({
    tabId,
    color: detected ? "#0d9488" : "#71717a",
  })
})
worker.onMessage("edit", async ({ data, sender }) => {
  trusted(sender)
  return {
    state: await store.edit(
      data.origin,
      data.edit,
      data.baseline,
      typeof data.key === "string" ? data.key : ""
    ),
  }
})
worker.onMessage("font", async ({ data, sender }) => {
  trusted(sender)
  await store.font(data.origin, data.family, data.css)
})
chrome.runtime.onInstalled.addListener(() => {
  syncEarlyScripts().catch(console.error)
})
chrome.runtime.onStartup.addListener(() => {
  syncEarlyScripts().catch(console.error)
})
