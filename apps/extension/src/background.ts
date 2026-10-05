import { createStore, readSite, worker } from "@coss-tweak/theme-core/coss"
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
    throw Error("Only HTTP(S) URLs without credentials are allowed")
  const response = await fetch(url, {
    credentials: "omit",
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw Error(`Fetch failed: HTTP ${response.status}`)
  if (Number(response.headers.get("content-length")) > 2_000_000)
    throw Error("Theme or stylesheet is too large")
  const text = await response.text()
  if (text.length > 2_000_000) throw Error("Theme or stylesheet is too large")
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
    id: `coss-tweak-${Array.from(new TextEncoder().encode(origin))
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")}`,
    matches: [`${origin}/*`],
    js: ["early.js"],
    runAt: "document_start" as const,
    persistAcrossSessions: true,
  }))
  const ids = new Set(scripts.map((s) => s.id))
  const obsolete = existing
    .filter((s) => s.id.startsWith("coss-tweak-") && !ids.has(s.id))
    .map((s) => s.id)
  if (obsolete.length)
    await chrome.scripting.unregisterContentScripts({ ids: obsolete })
  const known = new Set(existing.map((s) => s.id))
  const added = scripts.filter((s) => !known.has(s.id))
  if (added.length) await chrome.scripting.registerContentScripts(added)
}
const store = createStore(storage, syncEarlyScripts)
type Sender = chrome.runtime.MessageSender
// Only extension pages change preferences; content scripts can read storage but never write it.
function trusted(sender: Sender) {
  if (sender.tab && !sender.url?.startsWith(chrome.runtime.getURL("")))
    throw Error("Untrusted sender")
}
worker.onMessage("fetch", async ({ data }) => {
  if (typeof data.url !== "string") throw Error("Invalid URL")
  return { text: await fetchText(data.url) }
})
worker.onMessage("css", async ({ data, sender }) => {
  if (sender.tab?.id === undefined)
    throw Error("CSS requests must come from a tab")
  if (
    typeof data.css !== "string" ||
    typeof data.previous !== "string" ||
    data.css.length > 1_000_000 ||
    data.previous.length > 1_000_000
  )
    throw Error("Invalid injected CSS")
  const target = sender.documentId
    ? { tabId: sender.tab.id, documentIds: [sender.documentId] }
    : { tabId: sender.tab.id, frameIds: [sender.frameId ?? 0] }
  // The content script supplies the previous sheet, including after worker suspension.
  // Insert before removing so a failure leaves exactly the previous sheet installed.
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
  if (sender.tab?.id === undefined)
    throw Error("Detection reports must come from a tab")
  const tabId = sender.tab.id,
    detected = data.detected === true
  await chrome.action.setBadgeText({ tabId, text: detected ? "✓" : "—" })
  await chrome.action.setTitle({
    tabId,
    title: detected
      ? "coss tweak — 已检测主题变量"
      : "coss tweak — 未检测到主题变量",
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
worker.onMessage("themes", async ({ data, sender }) => {
  trusted(sender)
  return { themes: await store.themes(data.op) }
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
