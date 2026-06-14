import * as React from "react";
import { HexColorPicker } from "react-colorful";
import { toHex, colorFormatter } from "theme-core";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  /** 当前生效值（覆盖值或默认值），任意颜色格式。 */
  value: string;
  /** 输出 oklch 字符串。 */
  onChange: (oklch: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const hex = toHex(value);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="选择颜色"
        className="border-border size-6 shrink-0 rounded border"
        style={{ backgroundColor: hex }}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div className="absolute z-50 mt-1 space-y-2 rounded-md border bg-popover p-2 shadow-md">
          <HexColorPicker color={hex} onChange={(h) => onChange(colorFormatter(h, "oklch"))} />
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
