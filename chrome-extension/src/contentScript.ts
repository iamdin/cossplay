import { buildOverrideCss, emptyOverride, normalizeOverride, googleFontHref, NON_COLOR_CONTROLS, type ThemeOverride } from "theme-core";
import { STORAGE_KEY, type BgToContent, type DiscoverResult } from "./shared/messages";

const STYLE_ID = "coss-tweak";
const FONT_LINK_ID = "coss-tweak-fonts";

/** 按 base 中的字体栈注入/更新/移除 Google webfont <link>（联网,失败不影响其余）。 */
const applyFontLink = (base: Record<string, string>) => {
  const stacks = [base["font-sans"], base["font-mono"]].filter(Boolean) as string[];
  const href = googleFontHref(stacks);
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!href) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
};

const injectOverride = (override: ThemeOverride) => {
  const ov = normalizeOverride(override);
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
  }
  el.textContent = buildOverrideCss(ov);
  document.head.appendChild(el); // 保证在最后，源顺序取胜
  applyFontLink(ov.base);
};

const removeOverride = () => {
  document.getElementById(STYLE_ID)?.remove();
};

const loadStored = () => {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const stored = result[STORAGE_KEY] as ThemeOverride | undefined;
    if (stored) injectOverride(stored);
  });
};

let styleObserver: MutationObserver | null = null;

/** 被框架移除时重新注入。 */
const guardStyle = () => {
  styleObserver = new MutationObserver(() => {
    if (!document.getElementById(STYLE_ID)) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const stored = result[STORAGE_KEY] as ThemeOverride | undefined;
        if (stored) injectOverride(stored);
      });
    }
  });
  styleObserver.observe(document.head, { childList: true });
};

/** 收集 coss 的颜色 token（名不带 `--`）。用 CSS.supports 过滤掉 radius/font 等非颜色变量。 */
const collectTokens = (): string[] => {
  const raw: Record<string, string> = {};
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // 跨域样式表
    }
    for (const rule of Array.from(rules)) {
      if (
        rule instanceof CSSStyleRule &&
        (rule.selectorText === ":root" || rule.selectorText === ".dark")
      ) {
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          if (prop.startsWith("--")) {
            const name = prop.slice(2);
            const value = rule.style.getPropertyValue(prop).trim();
            if (value && !(name in raw)) raw[name] = value;
          }
        }
      }
    }
  }
  return Object.keys(raw)
    .filter((name) => {
      try {
        return CSS.supports("color", raw[name]);
      } catch {
        return false;
      }
    })
    .sort();
};

/** 读某模式下每个 token 的解析色值（#hex），通过临时元素让 var() resolve。 */
const readResolved = (names: string[]): Record<string, string> => {
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.opacity = "0";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);
  const out: Record<string, string> = {};
  for (const name of names) {
    probe.style.color = `var(--${name})`;
    const resolved = getComputedStyle(probe).color; // rgb(...)
    if (resolved) out[name] = resolved;
  }
  probe.remove();
  return out;
};

/** 读非颜色 token 的当前默认值（getComputedStyle）。 */
const readBaseDefaults = (): Record<string, string> => {
  const cs = getComputedStyle(document.documentElement);
  const out: Record<string, string> = {};
  for (const c of NON_COLOR_CONTROLS) {
    const v = cs.getPropertyValue(`--${c.token}`).trim();
    if (v) out[c.token] = v;
  }
  return out;
};

/**
 * 读 light + dark 两套默认值；过程中暂停 observer、同步恢复注入，避免竞态与闪烁。
 * 注意：只移除/恢复 #coss-tweak 样式；字体 <link>（#coss-tweak-fonts）由 applyFontLink 独立驱动，此处故意不动。
 */
const discover = (): DiscoverResult => {
  styleObserver?.disconnect();

  const names = collectTokens();
  const root = document.documentElement;

  const existing = document.getElementById(STYLE_ID);
  const savedCss = existing?.textContent ?? null;
  removeOverride();

  const base = readBaseDefaults();

  const wasDark = root.classList.contains("dark");
  root.classList.remove("dark");
  const light = readResolved(names);
  root.classList.add("dark");
  const dark = readResolved(names);
  if (wasDark) root.classList.add("dark");
  else root.classList.remove("dark");

  if (savedCss !== null) {
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = savedCss;
    document.head.appendChild(el);
  }

  styleObserver?.observe(document.head, { childList: true });
  return { names, light, dark, base };
};

// Guard all chrome API usage: only wire up when running as a real content script.
// On a plain page (e.g. during E2E testing via addScriptTag), chrome is undefined
// and chrome.runtime.id is falsy, so these blocks are safely skipped.
if (typeof chrome !== "undefined" && chrome?.runtime?.id) {
  chrome.runtime.onMessage.addListener((message: BgToContent, _sender, sendResponse) => {
    if (message?.type === "apply-vars") {
      injectOverride(message.override ?? emptyOverride());
      sendResponse({ ok: true });
      return true;
    }
    if (message?.type === "reset-vars") {
      removeOverride();
      sendResponse({ ok: true });
      return true;
    }
    if (message?.type === "get-vars") {
      const run = () => sendResponse({ ok: true, vars: discover() });
      if (document.readyState === "complete") run();
      else window.addEventListener("load", run, { once: true });
      return true;
    }
    return false;
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { loadStored(); guardStyle(); }, { once: true });
  } else {
    loadStored();
    guardStyle();
  }
}

// Test-only: expose the pure injector when not running in an extension context.
// In a real extension, chrome.runtime.id is truthy so this never executes (no leakage).
if (typeof chrome === "undefined" || !chrome?.runtime?.id) {
  (window as unknown as { __cossInject?: typeof injectOverride }).__cossInject = injectOverride;
}
