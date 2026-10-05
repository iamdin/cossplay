import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSiteStore } from "@/store/site-store"

/**
 * 语法高亮 + 一键复制的只读代码视图。
 * 从 tweakcn `components/ai-elements/code-block.tsx` 移植，去除 PostHog/analytics，
 * 主题随侧栏当前明暗模式（site-store `mode`）切换。
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
        "bg-background text-foreground relative w-full overflow-hidden",
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
