import { groupTokens, type ThemeMode } from "theme-core";
import { Button } from "@/components/ui/button";
import { useThemeOverride } from "@/hooks/use-theme-override";
import { TokenGroup } from "@/components/token-group";
import { PresetSelect } from "@/components/preset-select";
import { ExportDialog } from "@/components/export-dialog";
import { NonColorControls } from "@/components/non-color-controls";

type ChromeApi = {
  tabs?: {
    query: (
      q: { active: boolean; currentWindow: boolean },
      cb: (tabs: { id?: number }[]) => void,
    ) => void;
  };
  scripting?: {
    executeScript: (injection: {
      target: { tabId: number };
      func: (dark: boolean) => void;
      args: [boolean];
    }) => void;
  };
};

const chromeApi = (globalThis as { chrome?: ChromeApi }).chrome;

export function App() {
  const { override, names, defaults, mode, setMode, setToken, setBaseToken, applyPreset, reset, status, fetchDefaults } =
    useThemeOverride();

  const groups = groupTokens(names);

  const switchMode = (m: ThemeMode) => {
    setMode(m);
    chromeApi?.tabs?.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chromeApi?.scripting?.executeScript({
          target: { tabId: tab.id },
          func: (dark: boolean) => document.documentElement.classList.toggle("dark", dark),
          args: [m === "dark"],
        });
      }
    });
  };

  return (
    <div className="bg-background text-foreground min-h-screen p-4">
      <header className="space-y-1">
        <h1 className="text-base font-semibold">COSS 主题调色</h1>
        <p className="text-muted-foreground text-sm">仅对 coss.com/ui 生效</p>
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-md border">
          {(["light", "dark"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-3 py-1 text-xs ${mode === m ? "bg-primary text-primary-foreground" : ""}`}
            >
              {m === "light" ? "亮色" : "暗色"}
            </button>
          ))}
        </div>
        <PresetSelect onApply={applyPreset} />
        <ExportDialog override={override} />
        <Button size="sm" variant="outline" onClick={reset}>重置</Button>
        <Button size="sm" variant="outline" onClick={fetchDefaults}>读取当前</Button>
        {status && <span className="text-muted-foreground text-xs">{status}</span>}
      </div>

      <div className="mt-5 space-y-4">
        <NonColorControls
          defaults={defaults.base}
          overrides={override.base}
          onChange={setBaseToken}
        />
        {groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">请先打开 coss.com/ui 页面，再点「读取当前」</p>
        ) : (
          groups.map((g) => (
            <TokenGroup
              key={g.id}
              label={g.label}
              tokens={g.tokens}
              defaults={defaults[mode]}
              overrides={override[mode]}
              onChange={setToken}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default App;
