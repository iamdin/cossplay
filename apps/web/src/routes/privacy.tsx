import { createFileRoute } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { Footer, Logo } from "@/landing/chrome"
import styles from "@/styles/landing.css?url"

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "隐私 · Cossplay" },
      {
        name: "description",
        content:
          "Cossplay 的隐私政策：没有账户，不收集数据，主题留在你的浏览器里。",
      },
    ],
    links: [{ rel: "stylesheet", href: styles }],
  }),
  component: Privacy,
})

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-semibold text-lg">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

function Privacy() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b">
        <nav className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
          <Logo />
        </nav>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-semibold text-3xl tracking-tight">隐私</h1>
        <p className="mt-3 text-muted-foreground">
          最近更新：2026 年 10 月 7 日
        </p>
        <p className="mt-6">
          Cossplay
          没有账户，也没有自己的服务器。它不收集、不出售、不分享个人数据。
        </p>

        <Part title="Chrome 扩展">
          <p>
            扩展读取你打开它的页面上的 CSS
            主题变量，以便显示和编辑，再把改过的变量写回该页面。这些都发生在你的浏览器本地。
          </p>
          <p>
            主题、编辑历史和已加载的字体按网站存在你设备上的 Chrome
            扩展存储里。它们不会被发送到任何地方。卸载扩展即删除它们。
          </p>
          <p>
            为了读取页面主题，扩展可能会下载该页面自己的样式表，包括来自其他域名的，且不带
            cookie。除此之外，只有在你要求时才会发网络请求：加载字体时请求
            Google Fonts，导入主题时请求你填的 URL。没有分析和追踪。
          </p>
        </Part>

        <Part title="网站和网页 Editor">
          <p>
            cossplay.vercel.app 上的 Editor
            把主题存在浏览器的本地存储里。加载字体会向 Google Fonts
            请求样式表；从 URL 导入则会拉取该 URL。
          </p>
          <p>
            网站用 Vercel Web Analytics 统计页面浏览。它不用
            cookie，也不识别单个访客。
          </p>
          <p>
            你可以加到自己应用里的 Bridge 脚本，只在应用打开于 Editor
            的自定义预览时，与 Cossplay Editor 交换主题
            CSS。它不会把数据发到别处。
          </p>
        </Part>

        <Part title="联系">
          <p>
            隐私问题：请发邮件到 Cossplay 的 Chrome
            网上应用店页面上列出的开发者地址。
          </p>
        </Part>
      </main>
      <Footer />
    </div>
  )
}
