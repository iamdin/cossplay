const dismissalKey = "cossplay:getting-started:v1"

export function isGuideDismissed(): boolean {
  try {
    return localStorage.getItem(dismissalKey) === "dismissed"
  } catch {
    return false
  }
}

export function dismissGuide(): void {
  try {
    localStorage.setItem(dismissalKey, "dismissed")
  } catch {}
}
