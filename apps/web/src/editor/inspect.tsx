import { startInspector } from "@cossplay/core/coss"
import { focusControl, InspectToggle } from "@cossplay/editor/inspect"
import { usePanelStore } from "@cossplay/editor/store"
import { useEffect, useRef } from "react"

/** 预览工具栏上的检查开关；检查它所在的 `<main>`，不含自身控件。 */
export function PreviewInspector() {
  const ref = useRef<HTMLButtonElement>(null)
  const inspecting = usePanelStore((s) => s.inspecting)
  useEffect(() => {
    const root = ref.current?.closest("main")
    if (!inspecting || !root) return
    return startInspector(root, {
      onPick: focusControl,
      onExit: () => usePanelStore.setState({ inspecting: false }),
    })
  }, [inspecting])
  return <InspectToggle ref={ref} />
}
