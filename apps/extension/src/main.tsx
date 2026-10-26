import { Panel } from "@cossplay/editor/panel"
import { StrictMode, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { followSystemScheme } from "./scheme"
import { connect } from "./store/site-store"
import "@cossplay/editor/panel.css"

followSystemScheme()

function App() {
  useEffect(connect, [])
  return (
    <div className="h-screen">
      <Panel liveSite />
    </div>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
