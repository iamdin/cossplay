import pLimit from "p-limit"

// 串行替换 USER 来源的样式表。`installed` 只在 worker 确认后才变，失败时仍知道以后要卸哪一张。
export function cssInstaller(
  send: (css: string, previous: string) => Promise<void>,
  settled: () => void
) {
  let installed = "",
    requested = ""
  const queue = pLimit(1)
  // 检测必须知道 USER CSS 是否已经、或即将作用到计算样式上。
  const active = () => requested !== "" || installed !== ""
  function install(css: string) {
    if (requested === css) return
    requested = css
    queue(async () => {
      try {
        if (installed !== css) {
          await send(css, installed)
          installed = css
        }
      } catch (error) {
        // 允许之后相同的请求重试，除非已经排了更新的一次。
        if (requested === css) requested = installed
        console.error("Cossplay CSS injection failed", error)
      }
      settled()
    })
  }
  return { install, active }
}
