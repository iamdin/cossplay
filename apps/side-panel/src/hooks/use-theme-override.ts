import * as React from "react";
import { emptyOverride, type ThemeOverride, type ThemeMode } from "theme-core";

type DiscoverResult = { names: string[]; light: Record<string, string>; dark: Record<string, string> };

type ChromeRuntime = {
  sendMessage: (message: unknown, callback?: (response: unknown) => void) => void;
  lastError?: { message?: string };
};
type ChromeApi = { runtime?: ChromeRuntime };

const chromeApi = (globalThis as { chrome?: ChromeApi }).chrome;

export function useThemeOverride() {
  const [override, setOverride] = React.useState<ThemeOverride>(emptyOverride);
  const [names, setNames] = React.useState<string[]>([]);
  const [defaults, setDefaults] = React.useState<{ light: Record<string, string>; dark: Record<string, string> }>({ light: {}, dark: {} });
  const [mode, setMode] = React.useState<ThemeMode>("light");
  const [status, setStatus] = React.useState<string | null>(null);

  const flash = (m: string) => { setStatus(m); setTimeout(() => setStatus(null), 2000); };

  const push = React.useCallback((next: ThemeOverride) => {
    setOverride(next);
    chromeApi?.runtime?.sendMessage({ type: "set-vars", override: next });
  }, []);

  const setToken = React.useCallback((token: string, value: string) => {
    setOverride((prev) => {
      const next: ThemeOverride = { light: { ...prev.light }, dark: { ...prev.dark } };
      const bucket = next[mode];
      if (!value.trim()) delete bucket[token];
      else bucket[token] = value.trim();
      chromeApi?.runtime?.sendMessage({ type: "set-vars", override: next });
      return next;
    });
  }, [mode]);

  const applyPreset = React.useCallback((ov: ThemeOverride) => push(ov), [push]);

  const reset = React.useCallback(() => {
    setOverride(emptyOverride());
    chromeApi?.runtime?.sendMessage({ type: "reset-vars" });
  }, []);

  const fetchDefaults = React.useCallback(() => {
    chromeApi?.runtime?.sendMessage({ type: "get-vars" }, (resp: unknown) => {
      if (chromeApi?.runtime?.lastError) { flash("页面未连接，请刷新 coss"); return; }
      const payload = resp as { ok?: boolean; vars?: DiscoverResult };
      if (payload?.ok && payload.vars) {
        setNames(payload.vars.names);
        setDefaults({ light: payload.vars.light, dark: payload.vars.dark });
      }
    });
  }, []);

  React.useEffect(() => { fetchDefaults(); }, [fetchDefaults]);

  return { override, names, defaults, mode, setMode, setToken, applyPreset, reset, status, flash, fetchDefaults };
}
