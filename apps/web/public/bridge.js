// Cossplay bridge: lets the Cossplay editor (https://cossplay.vercel.app/editor) theme this
// page while it is shown in the editor's custom preview. It does nothing outside that frame.
//
// Protocol (window.postMessage):
//   editor → bridge  { source: "cossplay", type: "ping" }
//                    { source: "cossplay", type: "theme", css: string, dark: boolean }
//   bridge → editor  { source: "cossplay-bridge", type: "status", coss: boolean }
;(() => {
  if (window.parent === window || window.__cossplayBridge) return
  window.__cossplayBridge = true

  // Vercel preview domains are left out: anyone can name a project "<x>-kyriedin".
  const trusted = (origin) =>
    origin === "https://cossplay.vercel.app" ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)

  // coss ui declares these on :root; --info, --success and --warning are beyond shadcn/ui's set.
  // The bridge's own theme declares them too, so it is switched off while probing.
  const usesCoss = () => {
    if (style.sheet) style.sheet.disabled = true
    const root = getComputedStyle(document.documentElement)
    const found = ["--background", "--primary", "--info", "--success", "--warning"].every(
      (name) => root.getPropertyValue(name).trim() !== ""
    )
    if (style.sheet) style.sheet.disabled = false
    return found
  }

  const style = document.createElement("style")
  style.id = "cossplay-bridge"

  window.addEventListener("message", (event) => {
    const data = event.data
    if (event.source !== window.parent || !trusted(event.origin)) return
    if (!data || typeof data !== "object" || data.source !== "cossplay") return
    if (data.type === "ping")
      window.parent.postMessage(
        { source: "cossplay-bridge", type: "status", coss: usesCoss() },
        event.origin
      )
    else if (
      data.type === "theme" &&
      typeof data.css === "string" &&
      typeof data.dark === "boolean"
    ) {
      style.textContent = data.css
      // Last in <head> so it follows the app's own styles.
      document.head.append(style)
      document.documentElement.classList.toggle("dark", data.dark)
    }
  })
})()
