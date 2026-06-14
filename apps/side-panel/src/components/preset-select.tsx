import { defaultPresets, presetToOverride, type ThemeOverride } from "theme-core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PresetSelectProps {
  onApply: (override: ThemeOverride) => void;
}

export function PresetSelect({ onApply }: PresetSelectProps) {
  const entries = Object.entries(defaultPresets);
  return (
    <Select<string>
      onValueChange={(name) => {
        if (name) onApply(presetToOverride(defaultPresets[name]));
      }}
    >
      <SelectTrigger size="sm" className="w-[160px]">
        <SelectValue placeholder="预设主题" />
      </SelectTrigger>
      <SelectContent>
        {entries.map(([name, preset]) => (
          <SelectItem key={name} value={name}>
            {preset.label ?? name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
