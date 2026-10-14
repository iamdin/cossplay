/// <reference types="chrome" />
import { defineExtensionMessaging } from "@webext-core/messaging"
import type { Detection, Edit, SiteState } from "./site"
import type { Theme, Token } from "./theme"

// 由 service worker 处理的请求。只有 worker 会写扩展存储，所以每次读改写都在那里串行。
interface WorkerProtocol {
  fetch(data: { url: string }): { text: string }
  css(data: { css: string; previous: string }): void
  detected(data: { detected: boolean }): void
  edit(data: { origin: string; edit: Edit; baseline: Theme; key: string }): {
    state: SiteState
  }
  font(data: { origin: string; family: string; css: string }): void
}
// 由标签页里的 content script 处理的请求。
interface ContentProtocol {
  inspect(): { detection: Detection }
}
export const worker = defineExtensionMessaging<WorkerProtocol>()
export const content = defineExtensionMessaging<ContentProtocol>()
// 标签页上的检查模式和这个端口同寿：面板连上即开始，关掉面板、切换标签或导航都会断开。
// 标签页把用户点中的 token 发回来。
export const inspectorPort = "cossplay-inspector"
export type InspectorPick = { token: Token }
