// coss ui's theme variables (packages/ui/src/styles/globals.css): 41 colors plus radius and the
// font variables its @theme block maps. Defaults are coss's own values, resolved by
// scripts/sync-coss-defaults.ts; a page's detected values take precedence over them.
import reference from './defaults.json';
import { defaultPresets } from '../presets';
import { adjustColor, formatColor, parseColor, sourceFormat, type ColorFormat } from './colors';

export type Mode = 'light' | 'dark';
export const colorTokens = reference.colors as ColorToken[];
export const commonTokens = ['radius', 'font-sans', 'font-heading', 'font-mono'] as const;
export type ColorToken = Exclude<keyof typeof reference.light, (typeof commonTokens)[number]>;
export type Token = keyof typeof reference.light;
export type Theme = Record<Mode, Record<Token, string>>;
export type Overrides = Record<Mode, Partial<Record<Token, string>>>;
export const defaults: Theme = { light: reference.light, dark: reference.dark };
export const tokens = [...colorTokens, ...commonTokens] as Token[];
export const isCommon = (token: Token) => (commonTokens as readonly string[]).includes(token);
export const isColor = (token: Token) => (colorTokens as string[]).includes(token);
export const emptyOverrides = (): Overrides => ({ light: {}, dark: {} });
export const clone = <T>(value: T): T => structuredClone(value);
export const sidebarSync: Partial<Record<Token, Token>> = { sidebar: 'background', 'sidebar-foreground': 'foreground', 'sidebar-primary': 'primary', 'sidebar-primary-foreground': 'primary-foreground', 'sidebar-accent': 'accent', 'sidebar-accent-foreground': 'accent-foreground', 'sidebar-border': 'border', 'sidebar-ring': 'ring' };
// coss draws semantic foregrounds as text on the page (badges, alerts), not on the solid color.
export const contrastPairs: { label: string; foreground: Token; background: Token }[] = [
  ['Base', 'foreground', 'background'], ['Card', 'card-foreground', 'card'], ['Popover', 'popover-foreground', 'popover'],
  ['Primary', 'primary-foreground', 'primary'], ['Secondary', 'secondary-foreground', 'secondary'], ['Muted', 'muted-foreground', 'muted'], ['Accent', 'accent-foreground', 'accent'],
  ['Destructive', 'destructive-foreground', 'background'], ['Info', 'info-foreground', 'background'], ['Success', 'success-foreground', 'background'], ['Warning', 'warning-foreground', 'background'],
  ['Sidebar', 'sidebar-foreground', 'sidebar'], ['Sidebar Primary', 'sidebar-primary-foreground', 'sidebar-primary'], ['Sidebar Accent', 'sidebar-accent-foreground', 'sidebar-accent'], ['Code', 'code-foreground', 'code'],
].map(([label, foreground, background]) => ({ label, foreground: foreground as Token, background: background as Token }));
export function validValue(key: Token, value: string) {
  if (!value.trim() || value.length > 500 || /[;{}<>\n\r]|url\s*\(|@import|!important/i.test(value)) return false;
  if (isColor(key)) return !!parseColor(value);
  if (key.startsWith('font-')) return value.split(',').every(family => /^(?:"[\p{L}\p{N}\s_.-]+"|'[\p{L}\p{N}\s_.-]+'|[\p{L}_-][\p{L}\p{N}\s_-]*)$/u.test(family.trim()));
  const length = /^(?:\d+(?:\.\d+)?|\.\d+)(px|rem|em)?$/i.exec(value.trim());
  return !!length && (Number.parseFloat(value) === 0 || !!length[1]);
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Expected a theme object');
  return value as Record<string, unknown>;
}
const tokenName = (raw: string) => raw.replace(/^--/, '').replace(/^color-/, '') as Token;
// Keeps recognized tokens with concrete values. var(), color-mix() and --alpha() sources are skipped:
// they only make sense against the stylesheet they came from.
function readTokens(value: unknown): Partial<Record<Token, string>> {
  const result: Partial<Record<Token, string>> = {};
  for (const [raw, v] of Object.entries(record(value))) {
    const key = tokenName(raw);
    if (tokens.includes(key) && typeof v === 'string' && validValue(key, v.trim())) result[key] = v.trim();
  }
  return result;
}
// Imported themes and presets only override what they define; everything else stays the page's own.
// Shared tokens (radius, fonts) declared once apply to both modes.
export function importOverrides(value: unknown): Overrides {
  const data = record(value);
  const source = record(data.styles ?? data.cssVars ?? data);
  const shared = readTokens(source.theme ?? {});
  const light = readTokens(source.light ?? {}), dark = readTokens(source.dark ?? {});
  if (!Object.keys(light).length && !Object.keys(dark).length && !Object.keys(shared).length) throw Error('No recognized coss theme tokens');
  const common = Object.fromEntries(Object.entries({ ...shared, ...light }).filter(([key]) => isCommon(key as Token)));
  return { light: { ...shared, ...light }, dark: { ...common, ...dark } };
}
export const presets = defaultPresets;
export function presetOverrides(id: string): Overrides {
  if (!Object.hasOwn(presets, id)) throw Error('Unknown preset');
  return importOverrides(presets[id]);
}
export function adjustTheme(base: Theme, hue: number, saturation: number, lightness: number): Theme {
  const theme = clone(base);
  // HSL round trips clamp to sRGB; the neutral adjustment must keep wide-gamut oklch colors exact.
  if (hue === 0 && saturation === 1 && lightness === 1) return theme;
  for (const mode of ['light', 'dark'] as const) for (const key of colorTokens) theme[mode][key] = adjustColor(base[mode][key], hue, saturation, lightness);
  return theme;
}
// CSS variables for the overridden tokens, colors written in the page's own format.
export function variables(styles: Record<Token, string>, overrides: Partial<Record<Token, string>>, formats: Partial<Record<Token, ColorFormat>> = {}): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of tokens) if (key in overrides) result[key] = isColor(key) ? formatColor(styles[key], formats[key] ?? sourceFormat(defaults.light[key])) : key === 'radius' && Number.parseFloat(styles[key]) === 0 ? '0rem' : styles[key];
  return result;
}
// The same shape as coss ui's globals.css, so it can replace that file's theme section.
export function themeCss(theme: Theme, format: ColorFormat): string {
  const block = (selector: string, keys: Token[], values: Record<Token, string>) => {
    const formats = Object.fromEntries(colorTokens.map(key => [key, format]));
    return `${selector} {\n${Object.entries(variables(values, Object.fromEntries(keys.map(k => [k, ''])), formats)).map(([key, value]) => `  --${key}: ${value};`).join('\n')}\n}`;
  };
  return `${block(':root', tokens, theme.light)}\n\n${block('.dark', colorTokens, theme.dark)}`;
}
export function exportCss(theme: Theme, format: ColorFormat) {
  const bindings = [
    '  --font-sans: var(--font-sans);', '  --font-heading: var(--font-heading);', '  --font-mono: var(--font-mono);',
    ...colorTokens.map(key => `  --color-${key}: var(--${key});`),
    '  --radius-sm: calc(var(--radius) - 4px);', '  --radius-md: calc(var(--radius) - 2px);', '  --radius-lg: var(--radius);', '  --radius-xl: calc(var(--radius) + 4px);',
  ];
  return `@import "tailwindcss";\n\n@custom-variant dark (&:is(.dark *));\n\n@theme inline {\n${bindings.join('\n')}\n}\n\n${themeCss(theme, format)}\n\n@layer base {\n  * {\n    @apply border-border outline-ring/50;\n  }\n}\n`;
}
export function registryTheme(theme: Theme, name = 'coss-theme') {
  const colors = (mode: Mode) => Object.fromEntries(colorTokens.map(key => [key, formatColor(theme[mode][key], 'oklch')]));
  return { $schema: 'https://ui.shadcn.com/schema/registry-item.json', name, type: 'registry:style', cssVars: { theme: Object.fromEntries(commonTokens.map(k => [k, theme.light[k]])), light: colors('light'), dark: colors('dark') } };
}
export function exportLayout(theme: Theme, fonts: { family: string; weights: string[] }[]) {
  const slots = (['sans', 'heading', 'mono'] as const).flatMap(slot => {
    const family = theme.light[`font-${slot}`].split(',')[0].replaceAll(/['"]/g, '').trim();
    const font = fonts.find(f => f.family === family);
    return font ? [{ slot, font, name: family.replace(/\W+/g, '_').replace(/^(?=\d)/, '_') }] : [];
  });
  const imports = [...new Set(slots.map(s => s.name))].join(', ');
  const definitions = slots.map(s => `const font${s.slot[0].toUpperCase()}${s.slot.slice(1)} = ${s.name}({ subsets: ["latin"], weight: "${s.font.weights.includes('400') ? '400' : s.font.weights[0]}", variable: "--font-${s.slot}" });`).join('\n');
  const classes = slots.map(s => `\${font${s.slot[0].toUpperCase()}${s.slot.slice(1)}.variable}`).join(' ');
  return `import type { ReactNode } from "react";\n${imports ? `import { ${imports} } from "next/font/google";\n` : ''}import "./globals.css";\n\n${definitions}\n\nexport default function RootLayout({ children }: { children: ReactNode }) {\n  return (\n    <html lang="en">\n      <body className={\`${classes} relative font-sans\`}>\n        <div className="isolate relative flex min-h-svh flex-col">{children}</div>\n      </body>\n    </html>\n  );\n}\n`;
}
