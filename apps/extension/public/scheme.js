// First paint for the side panel. scheme.ts keeps the class in sync after load.
document.documentElement.classList.toggle(
  "dark",
  matchMedia("(prefers-color-scheme: dark)").matches,
)
