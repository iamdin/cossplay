import { z } from 'zod';
import type { ColorFormat } from './colors';
import { adjustTheme, clone, colorTokens, emptyOverrides, isCommon, sidebarSync, tokens, validValue, type Mode, type Overrides, type Theme, type Token } from './theme';
export type Source = { selector: string; mode: Mode; values: Partial<Record<Token, string>>; href: string | null };
// Facts about one document. They stay in that document and its panel, and are never persisted.
export type Detection = { detected: boolean; theme: Theme; sourceFormat: Record<Mode, Partial<Record<Token, ColorFormat>>>; sources: Source[]; mode: Mode; warnings: string[] };
export type Hsl = { hue: number; saturation: number; lightness: number };
// One undoable edit. Only user-chosen values; the effective theme is a document baseline plus these overrides.
// hslBase is the effective theme materialized when an HSL adjustment starts, so repeated adjustments do not compound.
export type Snapshot = { overrides: Overrides; themeId: string; hsl: Hsl; hslBase: Theme | null; sidebarSync: boolean };
// Origin-shared preferences, persisted under siteKey(origin) and written only by the worker.
export type SiteState = { enabled: boolean; origin: string; previewMode: Mode | null; current: Snapshot; past: Snapshot[]; future: Snapshot[] };
export type LocalTheme = { id: string; name: string; theme: Theme; createdAt: string };
// @wxt-dev/storage keys; the worker is their only writer.
export const siteKey = (origin: string) => `local:site:${origin}` as const;
export const fontsKey = (origin: string) => `local:fonts:${origin}` as const;
export const localThemesKey = 'local:localThemes';
const modes = ['light', 'dark'] as const;
const neutralHsl = (): Hsl => ({ hue: 0, saturation: 1, lightness: 1 });
export function snapshot(overrides: Overrides = emptyOverrides()): Snapshot {
  return { overrides, themeId: '', hsl: neutralHsl(), hslBase: null, sidebarSync: false };
}
export function newSite(origin: string): SiteState {
  return { origin, enabled: true, previewMode: null, current: snapshot(), past: [], future: [] };
}
export function effective(baseline: Theme, overrides: Overrides): Theme {
  return { light: { ...baseline.light, ...overrides.light }, dark: { ...baseline.dark, ...overrides.dark } };
}
export function commit(state: SiteState, next: Snapshot, coalesce = false): SiteState {
  if (JSON.stringify(state.current) === JSON.stringify(next)) return state;
  return { ...state, current: next, past: coalesce && state.past.length && !state.future.length ? state.past : [...state.past, state.current].slice(-80), future: [] };
}
export function undo(state: SiteState): SiteState {
  if (!state.past.length) return state;
  return { ...state, current: state.past.at(-1)!, past: state.past.slice(0, -1), future: [state.current, ...state.future] };
}
export function redo(state: SiteState): SiteState {
  if (!state.future.length) return state;
  return { ...state, current: state.future[0], past: [...state.past, state.current].slice(-80), future: state.future.slice(1) };
}

export type Edit =
  | { kind: 'token'; mode: Mode; token: Token; value: string }
  | { kind: 'theme'; overrides: Overrides; themeId: string }
  | { kind: 'hsl'; hsl: Hsl }
  | { kind: 'sidebar'; mode: Mode }
  | { kind: 'reset' } | { kind: 'undo' } | { kind: 'redo' }
  | { kind: 'enabled'; enabled: boolean }
  | { kind: 'preview'; mode: Mode };
// The single place edits change site state. The panel runs it optimistically; the worker runs it
// again on the latest stored state, so concurrent panels never overwrite each other's edits.
export function transition(state: SiteState, edit: Edit, baseline: Theme, coalesce = false): SiteState {
  switch (edit.kind) {
    case 'enabled': return { ...state, enabled: edit.enabled };
    case 'preview': return { ...state, previewMode: edit.mode };
    case 'undo': return undo(state);
    case 'redo': return redo(state);
    case 'reset': return { ...commit(state, snapshot()), previewMode: null };
    case 'theme': return commit(state, { ...snapshot(clone(edit.overrides)), themeId: edit.themeId });
    case 'token': {
      const next = clone(state.current);
      for (const mode of isCommon(edit.token) ? modes : [edit.mode]) next.overrides[mode][edit.token] = edit.value;
      if (next.sidebarSync) for (const [sidebar, base] of Object.entries(sidebarSync)) if (base === edit.token) next.overrides[edit.mode][sidebar as Token] = edit.value;
      next.hslBase = null; next.hsl = neutralHsl();
      return commit(state, next, coalesce);
    }
    case 'hsl': {
      const next = clone(state.current);
      next.hslBase ??= effective(baseline, next.overrides);
      const adjusted = adjustTheme(next.hslBase, edit.hsl.hue, edit.hsl.saturation, edit.hsl.lightness);
      for (const mode of modes) for (const key of colorTokens) next.overrides[mode][key] = adjusted[mode][key];
      next.hsl = edit.hsl;
      return commit(state, next, coalesce);
    }
    case 'sidebar': {
      const next = clone(state.current); next.sidebarSync = !next.sidebarSync;
      const theme = effective(baseline, next.overrides);
      if (next.sidebarSync) for (const [sidebar, base] of Object.entries(sidebarSync)) next.overrides[edit.mode][sidebar as Token] = theme[edit.mode][base!];
      return commit(state, next);
    }
  }
}
// Consecutive edits of one control within 500ms form one undo step, unless anything else changed in between.
export type LastEdit = { key: string; at: number; current: string };
export const coalesces = (last: LastEdit | null, key: string, state: SiteState, now: number) =>
  !!key && last?.key === key && now - last.at < 500 && last.current === JSON.stringify(state.current);

// Storage and messages are untrusted input: values end up in injected CSS. Parsing keeps what is
// valid and drops the rest, including fields from the legacy shape (document detection and materialized themes).
const modeValues = z.record(z.string(), z.unknown()).catch({}).transform(values =>
  Object.fromEntries(Object.entries(values).filter(([token, v]) => tokens.includes(token as Token) && typeof v === 'string' && validValue(token as Token, v))) as Partial<Record<Token, string>>);
const overridesSchema = z.object({ light: modeValues, dark: modeValues }).catch(emptyOverrides);
const themeSchema = overridesSchema.refine(overrides => modes.every(mode => Object.keys(overrides[mode]).length === tokens.length)).transform(overrides => overrides as Theme);
const hslSchema = z.object({ hue: z.number(), saturation: z.number(), lightness: z.number() });
const snapshotSchema = z.object({
  overrides: overridesSchema,
  themeId: z.string().catch(''),
  hsl: hslSchema.catch(neutralHsl),
  hslBase: themeSchema.nullable().catch(null),
  sidebarSync: z.boolean().catch(false),
}).catch(() => snapshot());
const historySchema = z.array(z.unknown()).catch([]).transform(list => list.slice(-80).map(item => snapshotSchema.parse(item)));
const siteSchema = (origin: string) => z.object({
  origin: z.literal(origin),
  enabled: z.boolean().catch(true),
  previewMode: z.enum(modes).nullable().catch(null),
  current: snapshotSchema,
  past: historySchema,
  future: historySchema,
});
const fontsSchema = z.record(z.string(), z.unknown()).catch({}).transform(fonts =>
  Object.fromEntries(Object.entries(fonts).filter((entry): entry is [string, string] => typeof entry[1] === 'string')));
const localThemeSchema = z.object({ id: z.string(), name: z.string(), theme: themeSchema, createdAt: z.unknown().transform(v => String(v ?? '')) });
const localThemesSchema = z.array(z.unknown()).catch([]).transform(items => items.flatMap(item => {
  const parsed = localThemeSchema.safeParse(item);
  return parsed.success ? [parsed.data] : [];
}));
export const readOverrides = (value: unknown): Overrides => overridesSchema.parse(value);
export const readTheme = (value: unknown): Theme | null => themeSchema.safeParse(value).data ?? null;
export const readSite = (value: unknown, origin: string): SiteState | null => siteSchema(origin).safeParse(value).data ?? null;
export const readFonts = (value: unknown): Record<string, string> => fontsSchema.parse(value);
export const readLocalThemes = (value: unknown): LocalTheme[] => localThemesSchema.parse(value);
