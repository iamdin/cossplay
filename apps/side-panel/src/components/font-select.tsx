import { FONTS } from "theme-core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FontSelectProps {
  token: string; // "font-sans" | "font-mono"
  value: string; // 当前栈（覆盖或默认）
  onChange: (token: string, value: string) => void;
}

export function FontSelect({ token, value, onChange }: FontSelectProps) {
  const kind = token === "font-mono" ? "mono" : "sans";
  const opts = FONTS.filter((f) => f.kind === kind);
  return (
    <Select<string>
      value={value || undefined}
      onValueChange={(v) => {
        if (v) onChange(token, v);
      }}
    >
      <SelectTrigger size="sm" className="flex-1">
        <SelectValue placeholder="默认字体" />
      </SelectTrigger>
      <SelectContent>
        {opts.map((f) => (
          <SelectItem key={f.id} value={f.stack}>
            {f.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
