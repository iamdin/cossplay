import { ColorPicker } from "./color-picker";

interface TokenRowProps {
  token: string;
  /** 该模式默认色值（#hex）。 */
  defaultValue?: string;
  /** 当前覆盖值（无则未改）。 */
  overrideValue?: string;
  onChange: (token: string, oklch: string) => void;
}

export function TokenRow({ token, defaultValue, overrideValue, onChange }: TokenRowProps) {
  const current = overrideValue ?? defaultValue ?? "";
  const changed = !!overrideValue;
  return (
    <div className={`flex items-center gap-2 rounded-md p-1.5 ${changed ? "bg-accent" : ""}`}>
      <ColorPicker value={current} onChange={(v) => onChange(token, v)} />
      <span className="text-foreground flex-1 truncate text-xs font-medium">--{token}</span>
      {changed && <span className="text-primary/60 text-[10px]">改</span>}
    </div>
  );
}
