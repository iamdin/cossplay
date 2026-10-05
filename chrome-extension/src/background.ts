import { createStore, failure, readSite, type WorkerRequest, type WorkerResponse } from 'theme-core/coss';

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' }).catch(console.error);

async function fetchText(raw: string) {
  const url = new URL(raw);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw Error('Only HTTP(S) URLs without credentials are allowed');
  const response = await fetch(url, { credentials: 'omit', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Error(`Fetch failed: HTTP ${response.status}`);
  if (Number(response.headers.get('content-length')) > 2_000_000) throw Error('Theme or stylesheet is too large');
  const text = await response.text();
  if (text.length > 2_000_000) throw Error('Theme or stylesheet is too large');
  return text;
}
async function syncEarlyScripts() {
  const stored = await chrome.storage.local.get(null);
  const desired = Object.entries(stored).filter(([key]) => key.startsWith('site:')).map(([key, value]) => readSite(value, key.slice('site:'.length)))
    .filter(state => state?.enabled && (state.previewMode || Object.values(state.current.overrides).some(v => Object.keys(v).length))).map(state => state!.origin);
  const existing = await chrome.scripting.getRegisteredContentScripts();
  const origins = [...new Set(desired)].sort();
  const scripts = origins.map(origin => ({ id: `coss-tweak-${Array.from(new TextEncoder().encode(origin)).map(n => n.toString(16).padStart(2, '0')).join('')}`, matches: [`${origin}/*`], js: ['dist/early.js'], runAt: 'document_start' as const, persistAcrossSessions: true }));
  const ids = new Set(scripts.map(s => s.id));
  const obsolete = existing.filter(s => s.id.startsWith('coss-tweak-') && !ids.has(s.id)).map(s => s.id);
  if (obsolete.length) await chrome.scripting.unregisterContentScripts({ ids: obsolete });
  const known = new Set(existing.map(s => s.id));
  const added = scripts.filter(s => !known.has(s.id));
  if (added.length) await chrome.scripting.registerContentScripts(added);
}
const store = createStore({
  get: async key => (await chrome.storage.local.get(key))[key],
  set: (key, value) => chrome.storage.local.set({ [key]: value }),
}, syncEarlyScripts);
type Sender = chrome.runtime.MessageSender;
// Only extension pages change preferences; content scripts can read storage but never write it.
function trusted(sender: Sender) {
  if (sender.tab && !sender.url?.startsWith(chrome.runtime.getURL(''))) throw Error('Untrusted sender');
}
const handlers: { [K in WorkerRequest['type']]: (message: Extract<WorkerRequest, { type: K }>, sender: Sender) => Promise<WorkerResponse[K]> } = {
  async fetch(message) {
    if (typeof message.url !== 'string') throw Error('Invalid URL');
    return { text: await fetchText(message.url) };
  },
  async css(message, sender) {
    if (sender.tab?.id === undefined) throw Error('CSS requests must come from a tab');
    if (typeof message.css !== 'string' || typeof message.previous !== 'string' || message.css.length > 1_000_000 || message.previous.length > 1_000_000) throw Error('Invalid injected CSS');
    const target = sender.documentId ? { tabId: sender.tab.id, documentIds: [sender.documentId] } : { tabId: sender.tab.id, frameIds: [sender.frameId ?? 0] };
    // The content script supplies the previous sheet, including after worker suspension.
    // Insert before removing so a failure leaves exactly the previous sheet installed.
    if (message.css) await chrome.scripting.insertCSS({ target, css: message.css, origin: 'USER' });
    if (message.previous) try { await chrome.scripting.removeCSS({ target, css: message.previous, origin: 'USER' }); } catch (error) {
      if (message.css) await chrome.scripting.removeCSS({ target, css: message.css, origin: 'USER' }).catch(console.error);
      throw error;
    }
    return { ok: true };
  },
  async detected(message, sender) {
    if (sender.tab?.id === undefined) throw Error('Detection reports must come from a tab');
    const tabId = sender.tab.id, detected = message.detected === true;
    await chrome.action.setBadgeText({ tabId, text: detected ? '✓' : '—' });
    await chrome.action.setTitle({ tabId, title: detected ? 'coss tweak — 已检测主题变量' : 'coss tweak — 未检测到主题变量' });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: detected ? '#0d9488' : '#71717a' });
    return { ok: true };
  },
  async edit(message, sender) {
    trusted(sender);
    return { state: await store.edit(message.origin, message.edit, message.baseline, typeof message.key === 'string' ? message.key : '') };
  },
  async themes(message, sender) {
    trusted(sender);
    return { themes: await store.themes(message.op) };
  },
  async font(message, sender) {
    trusted(sender);
    await store.font(message.origin, message.family, message.css);
    return { ok: true };
  },
};
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return;
  const type = (message as { type?: unknown } | null)?.type;
  if (typeof type !== 'string' || !Object.hasOwn(handlers, type)) { respond(failure('Unknown request')); return; }
  const handler = handlers[type as WorkerRequest['type']] as (message: WorkerRequest, sender: Sender) => Promise<WorkerResponse[WorkerRequest['type']]>;
  handler(message, sender).then(respond, error => respond(failure(error)));
  return true;
});
chrome.runtime.onInstalled.addListener(() => {
  // The single global CSS string of earlier versions is replaced by per-origin site state.
  chrome.storage.local.remove('cossThemeCss').catch(console.error);
  syncEarlyScripts().catch(console.error);
});
chrome.runtime.onStartup.addListener(() => { syncEarlyScripts().catch(console.error); });
