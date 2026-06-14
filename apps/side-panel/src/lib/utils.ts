import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Trailing-edge debounce with a `.cancel()` escape hatch. Ported from tweakcn
 * `utils/debounce.ts` so the color picker can throttle keystroke-driven updates.
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout>

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  } as T & { cancel: () => void }

  debounced.cancel = () => {
    clearTimeout(timeoutId)
  }

  return debounced
}

/**
 * Structural deep-equality check. Ported (as a dependency-free local util) to
 * replace tweakcn's `@ngard/tiny-isequal`-backed `isDeepEqual`. The editor
 * store uses this to dedupe history entries and detect unsaved changes.
 */
export function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((item, i) => isDeepEqual(item, b[i]))
  }

  const aKeys = Object.keys(a as Record<string, unknown>)
  const bKeys = Object.keys(b as Record<string, unknown>)
  if (aKeys.length !== bKeys.length) return false

  return aKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      isDeepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
  )
}
