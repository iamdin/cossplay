export function Logo() {
  return (
    <a href="/" className="flex items-center gap-2 font-semibold">
      <span className="grid size-6 place-items-center rounded-md bg-foreground">
        <span className="size-2.5 rounded-full border-2 border-background" />
      </span>
      Cossplay
    </a>
  )
}

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <a href="/privacy" className="hover:text-foreground">
            隐私
          </a>
          <span>
            预设来自{" "}
            <a
              href="https://github.com/jnsahaj/tweakcn"
              className="underline hover:text-foreground"
            >
              tweakcn
            </a>{" "}
            (Apache-2.0)
          </span>
          <span>与 coss、Cal.com、tweakcn 或 shadcn/ui 均无关联。</span>
        </div>
      </div>
    </footer>
  )
}
