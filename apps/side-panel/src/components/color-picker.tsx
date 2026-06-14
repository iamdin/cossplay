import * as React from "react";
import { HexAlphaColorPicker } from "react-colorful";
import { toHex8, colorFormatter } from "theme-core";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  /** 当前生效值（覆盖值或默认值），任意颜色格式。 */
  value: string;
  /** 输出 oklch 字符串（含 alpha）。 */
  onChange: (oklch: string) => void;
}

/** 透明棋盘格，让半透明色块可辨。 */
const CHECKER =
  "repeating-conic-gradient(#bbb 0% 25%, #fff 0% 50%) 50% / 8px 8px";

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const hex8 = toHex8(value);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="选择颜色"
        className="border-border size-6 shrink-0 rounded border"
        style={{ background: CHECKER }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="block size-full rounded" style={{ backgroundColor: hex8 }} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 space-y-2 rounded-md border bg-popover p-2 shadow-md">
          <HexAlphaColorPicker color={hex8} onChange={(h) => onChange(colorFormatter(h, "oklch"))} />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      )}
    </div>
  );
}
