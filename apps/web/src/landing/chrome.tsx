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
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <a href="/privacy" className="hover:text-foreground">
            Privacy
          </a>
          <a
            href="https://coss.com/ui/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            coss ui docs
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <span>
            Presets from{" "}
            <a
              href="https://github.com/jnsahaj/tweakcn"
              className="underline hover:text-foreground"
            >
              tweakcn
            </a>{" "}
            (Apache-2.0)
          </span>
          <span>Not affiliated with coss, Cal.com, tweakcn or shadcn/ui.</span>
        </div>
      </div>
    </footer>
  )
}
