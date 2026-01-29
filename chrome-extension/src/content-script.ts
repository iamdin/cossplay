const STORAGE_KEY = "cossThemeVars"

type ThemeVarValues = Record<string, string>

const applyVars = (vars: ThemeVarValues) => {
  const root = document.documentElement
  Object.entries(vars).forEach(([name, value]) => {
    root.style.setProperty(name, value)
  })
}

const clearVars = (vars: ThemeVarValues) => {
  const root = document.documentElement
  Object.keys(vars).forEach((name) => {
    root.style.removeProperty(name)
  })
}

const loadStoredVars = () => {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const stored = result[STORAGE_KEY] as ThemeVarValues | undefined
    if (stored && typeof stored === "object") {
      applyVars(stored)
    }
  })
}

type VarResult = {
  raw: ThemeVarValues
  computed: ThemeVarValues
  names: string[]
}

// Discover all CSS custom properties from :root and .dark selectors
const discoverAllVars = (callback: (result: VarResult) => void) => {
  const raw: ThemeVarValues = {}
  const computed: ThemeVarValues = {}
  const namesSet = new Set<string>()

  // Scan all stylesheets for CSS variables
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSStyleRule && (rule.selectorText === ":root" || rule.selectorText === ".dark")) {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i]
            if (prop.startsWith("--") && !prop.startsWith("--jjext")) {
              namesSet.add(prop)
              const value = rule.style.getPropertyValue(prop).trim()
              if (value && !raw[prop]) {
                raw[prop] = value
              }
            }
          }
        }
      }
    } catch {
      // Cross-origin stylesheets will throw, ignore them
    }
  }

  // Temporarily remove injected styles to get original computed values
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const stored = result[STORAGE_KEY] as ThemeVarValues | undefined
    const root = document.documentElement

    // Remove injected styles temporarily
    if (stored) {
      Object.keys(stored).forEach((name) => {
        root.style.removeProperty(name)
      })
    }

    // Get original computed values
    const computedStyle = getComputedStyle(root)
    for (const name of namesSet) {
      const value = computedStyle.getPropertyValue(name).trim()
      if (value) {
        computed[name] = value
        if (!raw[name]) {
          raw[name] = value
        }
      }
    }

    // Restore injected styles
    if (stored) {
      Object.entries(stored).forEach(([name, value]) => {
        root.style.setProperty(name, value)
      })
    }

    // Sort names for consistent display
    const names = Array.from(namesSet).sort()

    callback({ raw, computed, names })
  })
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "apply-vars") {
    applyVars((message.vars ?? {}) as ThemeVarValues)
    sendResponse({ ok: true })
    return true
  }

  if (message?.type === "reset-vars") {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const stored = result[STORAGE_KEY] as ThemeVarValues | undefined
      if (stored && typeof stored === "object") {
        clearVars(stored)
      }
      sendResponse({ ok: true })
    })
    return true
  }

  if (message?.type === "get-vars") {
    // Wait for styles to be fully loaded
    const doDiscover = () => {
      discoverAllVars((vars) => {
        sendResponse({ ok: true, vars })
      })
    }
    if (document.readyState === "complete") {
      doDiscover()
    } else {
      window.addEventListener("load", doDiscover, { once: true })
    }
    return true
  }

  return false
})

// Apply stored vars when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadStoredVars, { once: true })
} else {
  loadStoredVars()
}
