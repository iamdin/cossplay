import * as React from "react";
import { exportCss, type ThemeOverride } from "theme-core";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ExportDialogProps {
  override: ThemeOverride;
}

export function ExportDialog({ override }: ExportDialogProps) {
  const css = React.useMemo(() => exportCss(override, "oklch"), [override]);
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button size="sm" variant="secondary" />}>
        导出 CSS
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>导出 CSS（仅改动的 token）</AlertDialogTitle>
        </AlertDialogHeader>
        <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 text-xs">
          {css || "/* 暂无改动 */"}
        </pre>
        <AlertDialogFooter>
          <Button size="sm" onClick={copy} disabled={!css}>
            {copied ? "已复制" : "复制"}
          </Button>
          <AlertDialogCancel>关闭</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
