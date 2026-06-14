import { buildOverrideCss, type ThemeOverride } from "theme-core";
import { STORAGE_KEY, type BgToContent, type DiscoverResult } from "./shared/messages";

const STYLE_ID = "coss-tweak";

const emptyOverride = (): ThemeOverride => ({ light: {}, dark: {} });

/** 注入/更新覆盖样式：写 :root{} + .dark{} 两段，追加到 <head> 末尾。 */
const injectOverride = (override: ThemeOverride) => {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
  }
  el.textContent = buildOverrideCss(override);
  document.head.appendChild(el); // 保证在最后，源顺序取胜
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

/** 被框架移除时重新注入。 */
const guardStyle = () => {
  const observer = new MutationObserver(() => {
    if (!document.getElementById(STYLE_ID)) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const stored = result[STORAGE_KEY] as ThemeOverride | undefined;
        if (stored && buildOverrideCss(stored)) injectOverride(stored);
      });
    }
  });
  observer.observe(document.head, { childList: true });
};

/** 收集所有 coss 颜色 token 名（来自样式表 :root/.dark 规则，不带 `--`）。 */
const collectTokenNames = (): string[] => {
  const set = new Set<string>();
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
          if (prop.startsWith("--")) set.add(prop.slice(2));
        }
      }
    }
  }
  return Array.from(set).sort();
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

/** 读 light + dark 两套默认值；临时移除注入样式与切换 .dark 以取原始值。 */
const discover = (): DiscoverResult => {
  const names = collectTokenNames();
  const root = document.documentElement;

  const hadOverride = !!document.getElementById(STYLE_ID);
  removeOverride();
  const wasDark = root.classList.contains("dark");

  // light
  root.classList.remove("dark");
  const light = readResolved(names);
  // dark
  root.classList.add("dark");
  const dark = readResolved(names);

  // 还原
  if (wasDark) root.classList.add("dark");
  else root.classList.remove("dark");
  if (hadOverride) loadStored();

  return { names, light, dark };
};

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
