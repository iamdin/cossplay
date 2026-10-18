const schemeQuery = "(prefers-color-scheme: dark)"

/**
 * Point this side-panel document at the panel's existing `.dark` tokens.
 * The class stays on this document, so the page being edited is left alone.
 */
export function followSystemScheme(
  root: HTMLElement = document.documentElement
): () => void {
  const media = window.matchMedia(schemeQuery)
  const apply = () => root.classList.toggle("dark", media.matches)
  apply()
  media.addEventListener("change", apply)
  return () => media.removeEventListener("change", apply)
}
