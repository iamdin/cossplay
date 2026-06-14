import { NON_COLOR_CONTROLS } from "theme-core";
import { cn } from "@/lib/utils";
import { FontSelect } from "./font-select";

interface NonColorControlsProps {
  defaults: Record<string, string>;
  overrides: Record<string, string>;
  onChange: (token: string, value: string) => void;
}

export function NonColorControls({ defaults, overrides, onChange }: NonColorControlsProps) {
  return (
    <section className="space-y-1">
      <h2 className="text-muted-foreground px-1 text-xs font-semibold">布局 &amp; 字体</h2>
      {NON_COLOR_CONTROLS.map((c) => {
        const current = overrides[c.token] ?? defaults[c.token] ?? "";
        const changed = c.token in overrides;
        return (
          <div
            key={c.token}
            className={cn("flex items-center gap-2 rounded-md p-1.5", changed && "bg-accent")}
          >
            <span className="text-foreground w-20 shrink-0 truncate text-xs font-medium">
              {c.label}
            </span>
            {c.kind === "slider" ? (
              (() => {
                const num = parseFloat(current) || 0;
                return (
                  <>
                    <input
                      type="range"
                      aria-label={c.label}
                      min={c.min}
                      max={c.max}
                      step={c.step}
                      value={num}
                      onChange={(e) => onChange(c.token, `${e.target.value}${c.unit ?? ""}`)}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground w-16 shrink-0 text-right text-xs tabular-nums">
                      {num}
                      {c.unit}
                    </span>
                  </>
                );
              })()
            ) : (
              <FontSelect token={c.token} value={current} onChange={onChange} />
            )}
            {changed && <span className="text-primary/60 shrink-0 text-[10px]">改</span>}
          </div>
        );
      })}
    </section>
  );
}
