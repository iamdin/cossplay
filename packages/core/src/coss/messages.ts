/// <reference types="chrome" />
import { defineExtensionMessaging } from "@webext-core/messaging"
import type { Detection, Edit, SiteState } from "./site"
import type { Theme } from "./theme"

// Requests handled by the service worker. The worker is the only writer of extension storage,
// so every read-modify-write is serialized there.
interface WorkerProtocol {
  fetch(data: { url: string }): { text: string }
  css(data: { css: string; previous: string }): void
  detected(data: { detected: boolean }): void
  edit(data: { origin: string; edit: Edit; baseline: Theme; key: string }): {
    state: SiteState
  }
  font(data: { origin: string; family: string; css: string }): void
}
// Requests handled by the content script in a tab.
interface ContentProtocol {
  inspect(): { detection: Detection }
}
export const worker = defineExtensionMessaging<WorkerProtocol>()
export const content = defineExtensionMessaging<ContentProtocol>()
