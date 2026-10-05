import type { ThemeOp } from './messages';
import { coalesces, fontsKey, newSite, readFonts, readLocalThemes, readSite, readTheme, siteKey, transition, type Edit, type LastEdit, type LocalTheme, type SiteState } from './site';

export const LOCAL_THEMES = 'localThemes';
export type KeyValue = { get(key: string): Promise<unknown>; set(key: string, value: unknown): Promise<void> };
const themeName = (value: unknown) => {
  const trimmed = typeof value === 'string' ? value.trim().slice(0, 100) : '';
  if (!trimmed) throw Error('Theme name cannot be empty');
  return trimmed;
};
const httpOrigin = (origin: unknown): string => {
  if (typeof origin !== 'string' || !/^https?:\/\/[^/]+$/.test(origin)) throw Error('Invalid site origin');
  return origin;
};
// Owns every read-modify-write of extension storage. Operations run one at a time against
// the latest stored value, so callers send intents, never whole precomputed collections.
export function createStore(storage: KeyValue, afterSiteWrite: () => Promise<void> = async () => {}) {
  let queue: Promise<unknown> = Promise.resolve();
  const lastEdits = new Map<string, LastEdit>();
  function serialize<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task);
    queue = run.catch(() => {});
    return run;
  }
  return {
    edit(rawOrigin: string, edit: Edit, rawBaseline: unknown, key: string, now = Date.now()): Promise<SiteState> {
      return serialize(async () => {
        const origin = httpOrigin(rawOrigin), baseline = readTheme(rawBaseline);
        if (!baseline) throw Error('Invalid baseline theme');
        const state = readSite(await storage.get(siteKey(origin)), origin) ?? newSite(origin);
        const coalesce = coalesces(lastEdits.get(origin) ?? null, key, state, now);
        const next = readSite(transition(state, edit, baseline, coalesce), origin);
        if (!next) throw Error('Unknown edit');
        await storage.set(siteKey(origin), next);
        lastEdits.set(origin, { key, at: now, current: JSON.stringify(next.current) });
        await afterSiteWrite();
        return next;
      });
    },
    themes(op: ThemeOp, now = new Date()): Promise<LocalTheme[]> {
      return serialize(async () => {
        let themes = readLocalThemes(await storage.get(LOCAL_THEMES));
        if (op.kind === 'add') {
          const theme = readTheme(op.theme);
          if (!theme) throw Error('Invalid theme');
          themes = [...themes, { id: crypto.randomUUID(), name: themeName(op.name), theme, createdAt: now.toISOString() }];
        } else if (op.kind === 'rename') themes = themes.map(t => t.id === op.id ? { ...t, name: themeName(op.name) } : t);
        else if (op.kind === 'delete') themes = themes.filter(t => t.id !== op.id);
        else throw Error('Unknown theme operation');
        await storage.set(LOCAL_THEMES, themes);
        return themes;
      });
    },
    font(rawOrigin: string, family: unknown, css: unknown): Promise<void> {
      return serialize(async () => {
        const origin = httpOrigin(rawOrigin);
        if (typeof family !== 'string' || !family || typeof css !== 'string' || css.length > 500_000) throw Error('Invalid font stylesheet');
        const fonts = readFonts(await storage.get(fontsKey(origin)));
        await storage.set(fontsKey(origin), { ...fonts, [family]: css });
      });
    },
  };
}
