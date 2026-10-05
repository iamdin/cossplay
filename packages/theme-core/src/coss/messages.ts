/// <reference types="chrome" />
import type { Detection, Edit, LocalTheme, SiteState } from './site';
import type { Theme } from './theme';

export type ThemeOp = { kind: 'add'; name: string; theme: Theme } | { kind: 'rename'; id: string; name: string } | { kind: 'delete'; id: string };
// Requests handled by the service worker, keyed by type with their success responses.
// The worker is the only writer of chrome.storage, so every read-modify-write is serialized there.
export type WorkerRequest =
  | { type: 'fetch'; url: string }
  | { type: 'css'; css: string; previous: string }
  | { type: 'detected'; detected: boolean }
  | { type: 'edit'; origin: string; edit: Edit; baseline: Theme; key: string }
  | { type: 'themes'; op: ThemeOp }
  | { type: 'font'; origin: string; family: string; css: string };
export type WorkerResponse = { fetch: { text: string }; css: { ok: true }; detected: { ok: true }; edit: { state: SiteState }; themes: { themes: LocalTheme[] }; font: { ok: true } };
// Requests handled by the content script in a tab.
export type ContentRequest = { type: 'inspect' };
export type ContentResponse = { inspect: { detection: Detection } };
export type Failure = { error: string };

function unwrap<R>(result: R | Failure | undefined): R {
  if (!result) throw Error('No response');
  if (typeof result === 'object' && 'error' in result) throw Error(result.error);
  return result;
}
export async function toWorker<M extends WorkerRequest>(message: M): Promise<WorkerResponse[M['type']]> {
  return unwrap(await chrome.runtime.sendMessage<M, WorkerResponse[M['type']] | Failure>(message));
}
export async function toContent<M extends ContentRequest>(tabId: number, message: M): Promise<ContentResponse[M['type']]> {
  return unwrap(await chrome.tabs.sendMessage<M, ContentResponse[M['type']] | Failure>(tabId, message));
}
export const failure = (error: unknown): Failure => ({ error: String(error instanceof Error ? error.message : error) });
