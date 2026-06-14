export interface TokenGroupDef {
  id: string;
  label: string;
  tokens: string[];
}

/** 分组定义（顺序即显示顺序）。token key 不带 `--`。 */
export const TOKEN_GROUP_DEFS: TokenGroupDef[] = [
  {
    id: "base",
    label: "基础",
    tokens: [
      "background", "foreground", "card", "card-foreground",
      "popover", "popover-foreground",
    ],
  },
  {
    id: "primary",
    label: "主色",
    tokens: [
      "primary", "primary-foreground", "secondary", "secondary-foreground",
      "accent", "accent-foreground", "muted", "muted-foreground",
    ],
  },
  {
    id: "semantic",
    label: "语义",
    tokens: [
      "destructive", "destructive-foreground",
      "info", "info-foreground",
      "success", "success-foreground",
      "warning", "warning-foreground",
    ],
  },
  {
    id: "form",
    label: "边框/输入",
    tokens: ["border", "input", "ring"],
  },
  {
    id: "chart",
    label: "图表",
    tokens: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
  },
  {
    id: "sidebar",
    label: "侧边栏",
    tokens: [
      "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
      "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
    ],
  },
  {
    id: "code",
    label: "代码",
    tokens: ["code", "code-foreground", "code-highlight"],
  },
];

export const COLOR_TOKENS: Set<string> = new Set(
  TOKEN_GROUP_DEFS.flatMap((g) => g.tokens)
);

export const TOKEN_GROUPS = TOKEN_GROUP_DEFS;

const tokenToGroupId = new Map<string, string>();
for (const g of TOKEN_GROUP_DEFS) {
  for (const t of g.tokens) tokenToGroupId.set(t, g.id);
}

export interface GroupedTokens {
  id: string;
  label: string;
  tokens: string[];
}

/** 把发现的 token 名按分组归类；未知归入 "other"；空组省略。 */
export function groupTokens(names: string[]): GroupedTokens[] {
  const buckets = new Map<string, string[]>();
  const unknown: string[] = [];

  for (const name of names) {
    const gid = tokenToGroupId.get(name);
    if (!gid) {
      unknown.push(name);
      continue;
    }
    if (!buckets.has(gid)) buckets.set(gid, []);
    buckets.get(gid)!.push(name);
  }

  const result: GroupedTokens[] = [];
  for (const g of TOKEN_GROUP_DEFS) {
    const tokens = buckets.get(g.id);
    if (tokens && tokens.length) {
      result.push({ id: g.id, label: g.label, tokens });
    }
  }
  if (unknown.length) {
    result.push({ id: "other", label: "其它", tokens: unknown });
  }
  return result;
}
