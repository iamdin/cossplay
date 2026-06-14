import { describe, it, expect, beforeEach } from "vitest"
import { useEditorStore } from "../editor-store"

describe("editor-store seeded flag", () => {
  beforeEach(() => {
    localStorage.clear()
    // 重置到初始状态，避免用例间串味。
    useEditorStore.setState({ seeded: false })
  })

  it("defaults to false", () => {
    expect(useEditorStore.getState().seeded).toBe(false)
  })

  it("flips to true via setSeeded", () => {
    useEditorStore.getState().setSeeded(true)
    expect(useEditorStore.getState().seeded).toBe(true)
  })

  it("persists seeded into the storage payload (partialize includes it)", () => {
    useEditorStore.getState().setSeeded(true)
    const raw = localStorage.getItem("coss-editor-storage")
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw as string)
    // zustand persist 包了一层 { state, version }
    expect(parsed.state.seeded).toBe(true)
    // 工作样式也应被持久化（回访存活的权威来源）。
    expect(parsed.state.themeState).toBeTruthy()
  })
})
