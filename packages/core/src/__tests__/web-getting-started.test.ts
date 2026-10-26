import {
  dismissGuide,
  isGuideDismissed,
} from "../../../../apps/web/src/editor/getting-started-storage"

const key = "cossplay:getting-started:v1"

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe("web editor getting-started dismissal", () => {
  it("shows the guide for a first visit", () => {
    expect(isGuideDismissed()).toBe(false)
  })

  it.each(["", "true", "unknown"])(
    "ignores an unrecognized stored value: %s",
    (value) => {
      localStorage.setItem(key, value)
      expect(isGuideDismissed()).toBe(false)
    }
  )

  it("persists dismissal without changing existing editor settings", () => {
    localStorage.setItem("cossplay:panel-width", "400")
    localStorage.setItem("existing-theme", "saved theme")
    dismissGuide()
    expect(localStorage.getItem(key)).toBe("dismissed")
    expect(isGuideDismissed()).toBe(true)
    expect(localStorage.getItem("cossplay:panel-width")).toBe("400")
    expect(localStorage.getItem("existing-theme")).toBe("saved theme")
  })

  it("shows the guide when storage reads are blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError")
    })
    expect(isGuideDismissed()).toBe(false)
  })

  it("does not throw when storing dismissal fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage full", "QuotaExceededError")
    })
    expect(() => dismissGuide()).not.toThrow()
  })

  it("handles unavailable storage, including server rendering", () => {
    vi.stubGlobal("localStorage", undefined)
    expect(isGuideDismissed()).toBe(false)
    expect(() => dismissGuide()).not.toThrow()
  })

  it("handles a storage getter that throws", () => {
    vi.spyOn(globalThis, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError")
    })
    expect(isGuideDismissed()).toBe(false)
    expect(() => dismissGuide()).not.toThrow()
  })
})
