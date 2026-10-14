import { defaults, groups } from "@cossplay/core/coss"
import { focusControl } from "@cossplay/editor/inspect"
import { groupLabel } from "@cossplay/editor/panel"
import { usePanelStore, useTheme } from "@cossplay/editor/store"

// 当前模式的每个颜色 token，分组同面板；色块跳到对应控件。
export function Palette() {
  const theme = useTheme() ?? defaults
  const mode = usePanelStore((s) => s.mode)
  return (
    <div className="space-y-6 px-4 pt-2 pb-6">
      {Object.entries(groups).map(([group, tokens]) => (
        <section key={group}>
          <h2 className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {groupLabel(group)}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
            {tokens.map((token) => (
              <button
                key={token}
                type="button"
                title={`编辑 ${token}`}
                onClick={() => focusControl(token)}
                className="cursor-pointer overflow-hidden rounded-lg border bg-card text-left text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className="block h-16 border-b"
                  style={{ background: `var(--${token})` }}
                />
                <span className="block truncate px-2 pt-1.5 font-medium text-xs">
                  {token}
                </span>
                <span className="block truncate px-2 pb-1.5 font-mono text-[10px] text-muted-foreground">
                  {theme[mode][token]}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
