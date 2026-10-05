import { Button } from "@coss-tweak/ui/components/button"
import { cn } from "@coss-tweak/ui/lib/utils"
import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism"
import { useSiteStore } from "@/store/site-store"

/**
 * 语法高亮 + 一键复制的只读代码视图，主题随侧栏当前明暗模式（site-store `mode`）切换。
 */

interface CodeBlockProps {
  code: string
  language: string
  className?: string
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const currentMode = useSiteStore((s) => s.mode)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-background text-foreground",
        className
      )}
    >
      <SyntaxHighlighter
        language={language}
        style={currentMode === "light" ? oneLight : oneDark}
        codeTagProps={{ className: "font-mono text-xs" }}
        customStyle={{
          margin: 0,
          padding: "0.75rem",
          fontSize: "0.75rem",
          background: "transparent",
        }}
      >
        {code}
      </SyntaxHighlighter>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={copyToClipboard}
        className="absolute top-2 right-2"
        aria-label={copied ? "已复制" : "复制"}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  )
}
