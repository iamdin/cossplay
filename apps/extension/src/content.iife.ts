import { clone, cssInstaller, defaults, effective, failure, fontsKey, isColor, readFonts, readSite, siteKey, sourceFormat, tokens, toWorker, validValue, variables, type ContentRequest, type ContentResponse, type Detection, type Failure, type Mode, type SiteState, type Source, type Token } from '@coss-tweak/theme-core/coss';

const origin = location.origin, key = siteKey(origin);
// Origin preferences come from storage; detection belongs to this document only.
let state: SiteState | null = null, detection: Detection | null = null, applied: HTMLStyleElement | null = null;
let restoring = false;
let fonts: Record<string, string> = {};
let fontStyle: HTMLStyleElement | null = null;
const fallback = cssInstaller(async (css, previous) => { await toWorker({ type: 'css', css, previous }); }, () => document.getElementById('coss-tweak-loading')?.remove());
let originalDark = false, originalClassPresent = false, originalTheme: string | null = null;
let modeCaptured = false;
const currentMode = (): Mode => document.documentElement?.classList.contains('dark') || document.documentElement?.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
function restoreMode() {
  if (!modeCaptured || !document.documentElement) return;
  modeCaptured = false;
  restoring = true;
  document.documentElement.classList.toggle('dark', originalDark);
  if (!originalClassPresent && !document.documentElement.classList.length) document.documentElement.removeAttribute('class');
  if (originalTheme === null) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', originalTheme);
  restoring = false;
}
function apply() {
  if (!document.documentElement || !detection) return;
  if (!state?.enabled || !detection.detected) {
    applied?.remove(); applied = null; fontStyle?.remove(); fontStyle = null; fallback.install(''); restoreMode();
    document.getElementById('coss-tweak-loading')?.remove();
    return;
  }
  if (state.previewMode) {
    if (!modeCaptured) {
      originalDark = document.documentElement.classList.contains('dark');
      originalClassPresent = document.documentElement.hasAttribute('class');
      originalTheme = document.documentElement.getAttribute('data-theme'); modeCaptured = true;
    }
    document.documentElement.classList.toggle('dark', state.previewMode === 'dark');
    if (originalTheme !== null || detection.sources.some(s => s.selector.includes('[data-theme'))) document.documentElement.setAttribute('data-theme', state.previewMode);
  } else restoreMode();
  const mode = state.previewMode ?? currentMode();
  const { overrides } = state.current, theme = effective(detection.theme, overrides);
  const rules: string[] = [];
  const add = (selector: string, targetMode: Mode, declared?: Source['values']) => {
    const selected = declared ? Object.fromEntries(Object.entries(overrides[targetMode]).filter(([name]) => name in declared)) : overrides[targetMode];
    const formats = { ...detection!.sourceFormat[targetMode] };
    if (declared) for (const token of tokens) if (isColor(token) && declared[token] && validValue(token, declared[token]!)) formats[token] = sourceFormat(declared[token]!);
    const values = variables(theme[targetMode], selected, formats);
    if (Object.keys(values).length) rules.push(`${selector} { ${Object.entries(values).map(([name, value]) => `--${name}: ${value} !important;`).join(' ')} }`);
  };
  add(':root:root', mode);
  for (const source of detection.sources) {
    // Keep scoped variables working, without touching unrelated utility classes.
    if (/^\.dark$/.test(source.selector.trim())) { if (mode === 'dark') add('.dark.dark', 'dark', source.values); continue; }
    const targetMode = source.mode === 'dark' || /\[data-theme\s*=/.test(source.selector) ? source.mode : mode;
    add(source.selector, targetMode, source.values);
  }
  if (rules.length) {
    if (!applied) { applied = document.createElement('style'); applied.id = 'coss-tweak-theme'; }
    const text = rules.join('\n'); if (applied.textContent !== text) applied.textContent = text;
    const parent = document.head ?? document.documentElement;
    if (applied.parentElement !== parent || parent.lastElementChild !== applied) parent.append(applied);
  } else { applied?.remove(); applied = null; }
  const activeFonts = Object.entries(fonts).filter(([family]) => (['font-sans', 'font-heading', 'font-mono'] as const).some(token => token in overrides[mode] && theme[mode][token].split(',').some(name => name.replaceAll(/['"]/g, '').trim().toLowerCase() === family.toLowerCase())));
  if (activeFonts.length) {
    fontStyle ??= document.createElement('style'); fontStyle.id = 'coss-tweak-fonts';
    const fontCss = activeFonts.map(([, css]) => css).join('\n');
    if (fontStyle.textContent !== fontCss) fontStyle.textContent = fontCss;
    if (!fontStyle.isConnected) (document.head ?? document.documentElement).append(fontStyle);
  } else { fontStyle?.remove(); fontStyle = null; }
  // USER-origin !important variables survive later author rules regardless of specificity.
  fallback.install(rules.join('\n'));
  if (!rules.length) document.getElementById('coss-tweak-loading')?.remove();
}
const ready = new Promise<void>(resolve => {
  if (document.readyState !== 'loading') resolve(); else document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
});
async function detect(): Promise<Detection> {
  // Native CSS can paint well before slow deferred scripts fire DOMContentLoaded.
  await new Promise<void>(resolve => {
    let frame = 0;
    const finish = () => { cancelAnimationFrame(frame); resolve(); };
    ready.then(finish);
    const check = () => {
      const root = document.documentElement;
      if (root && (['background', 'primary', 'foreground'] as const).every(k => validValue(k, getComputedStyle(root).getPropertyValue(`--${k}`).trim()))) finish();
      else frame = requestAnimationFrame(check);
    };
    check();
  });
  const sources: Source[] = [], warnings: string[] = [];
  const seen = new Set<CSSStyleSheet>();
  const external: string[] = [];
  function walk(rules: CSSRuleList, href: string | null) {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        // Tailwind arbitrary properties such as `[--radius:9999px]` scope a token to one component on
        // purpose (coss uses them for pills and subtle borders); they are not theme sources.
        if (rule.selectorText.includes('\\[--')) continue;
        const values: Partial<Record<Token, string>> = {};
        for (const token of tokens) {
          const value = rule.style.getPropertyValue(`--${token}`).trim();
          if (value) values[token] = value;
        }
        if (Object.keys(values).length) sources.push({ selector: rule.selectorText, mode: /\.dark\b|\[data-theme\s*=\s*["']?dark/.test(rule.selectorText) ? 'dark' : 'light', values, href });
      } else if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules, href);
      else if (rule instanceof CSSImportRule && rule.styleSheet) sheet(rule.styleSheet);
    }
  }
  function sheet(value: CSSStyleSheet) {
    if (seen.has(value) || value.ownerNode === applied || (value.ownerNode instanceof HTMLElement && value.ownerNode.id.startsWith('coss-tweak-'))) return;
    seen.add(value);
    try { walk(value.cssRules, value.href); } catch { if (value.href) external.push(value.href); }
  }
  for (const value of [...Array.from(document.styleSheets), ...document.adoptedStyleSheets]) sheet(value);
  const externalReads = Promise.all(external.map(async url => {
    try {
      const { text } = await toWorker({ type: 'fetch', url });
      const parsed = new CSSStyleSheet(); parsed.replaceSync(text); walk(parsed.cssRules, url);
    } catch (error) { warnings.push(`Cannot read stylesheet ${url}: ${String(error)}`); }
  }));
  const root = document.documentElement;
  const canDetectNow = sources.some(s => s.values.background && s.values.primary) || (['background', 'primary', 'foreground'] as const).every(k => validValue(k, getComputedStyle(root).getPropertyValue(`--${k}`).trim()));
  // Do not delay saved root themes for an unrelated cross-origin stylesheet fetch.
  if (!canDetectNow) await externalReads;
  const previousClass = root.getAttribute('class'), previousTheme = root.getAttribute('data-theme');
  // ponytail: USER-origin CSS is not in CSSOM; retain the captured baseline while fallback is active.
  // Temporarily remove the fallback to resample if live native-baseline tracking becomes necessary.
  if (fallback.active() && detection) return { ...detection, sources, warnings };
  // Detection changes modes synchronously; do not leave native components mid-transition.
  const measuring = document.createElement('style'); measuring.id = 'coss-tweak-measuring';
  measuring.textContent = '*, *::before, *::after { transition: none !important; }';
  (document.head ?? root).append(measuring);
  root.getBoundingClientRect();
  const previousDisabled = applied?.sheet?.disabled;
  if (applied?.sheet) applied.sheet.disabled = true;
  const modeBefore = modeCaptured ? (originalDark || originalTheme === 'dark' ? 'dark' : 'light') : currentMode();
  const probe = document.createElement('coss-tweak-probe');
  root.append(probe);
  const result: Detection = { detected: false, theme: clone(defaults), sourceFormat: { light: {}, dark: {} }, sources, mode: modeBefore, warnings };
  try {
    for (const mode of ['light', 'dark'] as const) {
      root.classList.toggle('dark', mode === 'dark');
      if (previousTheme !== null) root.setAttribute('data-theme', mode);
      const computed = getComputedStyle(root);
      for (const token of tokens) {
        const raw = computed.getPropertyValue(`--${token}`).trim();
        let value = raw;
        // coss declares colors as var(), color-mix() and --alpha(); let the browser resolve them.
        if (raw && isColor(token) && !validValue(token, raw) && CSS.supports('color', raw)) {
          probe.style.setProperty('color', `var(--${token})`, 'important');
          value = getComputedStyle(probe).color;
        }
        if (!value) for (const source of sources) {
          if (!source.values[token]) continue;
          try {
            const element = document.querySelector(source.selector);
            const local = element && getComputedStyle(element).getPropertyValue(`--${token}`).trim();
            if (local && validValue(token, local)) { value = local; break; }
          } catch { /* :host and pseudo-element selectors have no queryable element. */ }
        }
        if (value && validValue(token, value)) {
          result.theme[mode][token] = value;
          if (isColor(token)) result.sourceFormat[mode][token] = validValue(token, raw) ? sourceFormat(raw) : 'oklch';
        }
      }
    }
    result.detected = sources.some(s => s.values.background && s.values.primary) || (['background', 'primary', 'foreground'] as const).every(k => !!getComputedStyle(root).getPropertyValue(`--${k}`).trim());
  } finally {
    probe.remove();
    if (previousClass === null) root.removeAttribute('class'); else root.setAttribute('class', previousClass);
    if (previousTheme === null) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', previousTheme);
    if (applied?.sheet && previousDisabled !== undefined) applied.sheet.disabled = previousDisabled;
    detection = result;
    // Restore before removing the measurement guard so native transitions never start.
    apply();
    root.getBoundingClientRect();
    measuring.remove();
  }
  await externalReads;
  apply();
  return result;
}
const initial = chrome.storage.local.get([key, fontsKey(origin)]).then(async data => {
  state = readSite(data[key], origin);
  fonts = readFonts(data[fontsKey(origin)]);
  if (!document.documentElement) await new Promise<void>(resolve => {
    const observer = new MutationObserver(() => { if (document.documentElement) { observer.disconnect(); resolve(); } }); observer.observe(document, { childList: true });
  });
  apply();
}).catch(error => { document.getElementById('coss-tweak-loading')?.remove(); console.error('coss tweak restore failed', error); });
let detecting: Promise<Detection> | null = null;
async function inspect() {
  await initial;
  if (!detecting) detecting = detect();
  const detected = await detecting;
  await toWorker({ type: 'detected', detected: detected.detected });
  return { detection: detected };
}
initial.then(inspect).catch(error => console.error('coss tweak detection failed', error));
chrome.runtime.onMessage.addListener((message: ContentRequest, _sender, respond: (response: ContentResponse['inspect'] | Failure) => void) => {
  if (message?.type !== 'inspect') return;
  inspect().then(respond, error => respond(failure(error)));
  return true;
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes[key]) state = readSite(changes[key].newValue, origin);
  if (changes[fontsKey(origin)]) fonts = readFonts(changes[fontsKey(origin)].newValue);
  if (changes[key] || changes[fontsKey(origin)]) apply();
});
new MutationObserver(() => {
  if (restoring || !state) return;
  const parent = document.head ?? document.documentElement;
  if ((state.enabled && state.previewMode && currentMode() !== state.previewMode) || (applied && (!applied.isConnected || parent.lastElementChild !== applied))) apply();
}).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'data-theme'] });
