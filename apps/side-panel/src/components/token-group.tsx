import { TokenRow } from "./token-row";

interface TokenGroupProps {
  label: string;
  tokens: string[];
  defaults: Record<string, string>;
  overrides: Record<string, string>;
  onChange: (token: string, oklch: string) => void;
}

export function TokenGroup({ label, tokens, defaults, overrides, onChange }: TokenGroupProps) {
  return (
    <section className="space-y-1">
      <h2 className="text-muted-foreground px-1 text-xs font-semibold">{label}</h2>
      {tokens.map((t) => (
        <TokenRow
          key={t}
          token={t}
          defaultValue={defaults[t]}
          overrideValue={overrides[t]}
          onChange={onChange}
        />
      ))}
    </section>
  );
}
