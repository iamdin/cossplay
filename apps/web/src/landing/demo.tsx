import {
  defaults,
  effective,
  presetOverrides,
  presets,
  variables,
} from "@cossplay/core/coss"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@cossplay/ui/components/alert"
import { Avatar, AvatarFallback } from "@cossplay/ui/components/avatar"
import { Badge } from "@cossplay/ui/components/badge"
import { Button } from "@cossplay/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@cossplay/ui/components/card"
import { Field, FieldLabel } from "@cossplay/ui/components/field"
import { Input } from "@cossplay/ui/components/input"
import { Label } from "@cossplay/ui/components/label"
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@cossplay/ui/components/progress"
import { Switch } from "@cossplay/ui/components/switch"
import { cn } from "@cossplay/ui/lib/utils"
import { CheckIcon, InfoIcon, MoonIcon, SunIcon } from "lucide-react"
import { type CSSProperties, useEffect, useMemo, useState } from "react"

// 带品牌名的预设不放在营销页上。
const shown = [
  "default",
  "violet-bloom",
  "doom-64",
  "catppuccin",
  "kodama-grove",
  "neo-brutalism",
  "vintage-paper",
  "cosmic-night",
  "bubblegum",
  "ocean-breeze",
]
const label = (id: string) =>
  id === "default" ? "coss ui" : (presets[id]?.label ?? id)

const loadedFonts = new Set<string>()
/** 为演示加载预设的 Google 字体；系统和 Geist 字体栈不用加载。 */
function loadFont(stack: string | undefined) {
  const family = stack?.split(",")[0].replaceAll(/['"]/g, "").trim()
  if (!family || /^(Geist|ui-|system-ui|Courier New)/.test(family)) return
  if (loadedFonts.has(family)) return
  loadedFonts.add(family)
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`
  document.head.append(link)
}

/** 用预设就地换肤的 coss ui 组件，和 Editor、扩展一样。 */
export function ThemeDemo() {
  const [id, setId] = useState("violet-bloom")
  const [dark, setDark] = useState(false)
  const mode = dark ? "dark" : "light"
  const style = useMemo(() => {
    const overrides = presetOverrides(id)
    const theme = effective(defaults, overrides)
    const vars = variables(theme[mode], overrides[mode])
    return Object.fromEntries(
      Object.entries(vars).map(([key, value]) => [`--${key}`, value])
    ) as CSSProperties
  }, [id, mode])
  useEffect(() => loadFont(presetOverrides(id).light["font-sans"]), [id])

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xl/5">
      <div className="flex flex-wrap items-center gap-1.5 border-b bg-muted/50 p-2">
        {shown.map((preset) => (
          <Button
            key={preset}
            size="xs"
            variant={preset === id ? "default" : "ghost"}
            aria-pressed={preset === id}
            onClick={() => setId(preset)}
          >
            {label(preset)}
          </Button>
        ))}
        <Button
          size="icon-xs"
          variant="outline"
          className="ml-auto"
          aria-label={dark ? "浅色模式" : "深色模式"}
          onClick={() => setDark(!dark)}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>
      <div className={cn(dark && "dark")}>
        <div
          style={{ ...style, fontFamily: "var(--font-sans)" }}
          className="grid gap-4 bg-background p-4 text-foreground transition-colors sm:grid-cols-2 sm:p-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>创建账户</CardTitle>
              <CardDescription>开始 14 天试用。</CardDescription>
            </CardHeader>
            <CardPanel className="flex flex-col gap-3">
              <Field>
                <FieldLabel>邮箱</FieldLabel>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  aria-label="演示邮箱"
                />
              </Field>
              <Label className="font-normal">
                <Switch defaultChecked />
                接收产品动态
              </Label>
              <div className="flex gap-2">
                <Button className="flex-1">注册</Button>
                <Button variant="outline">登录</Button>
              </div>
            </CardPanel>
          </Card>
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardDescription>月收入</CardDescription>
                <CardTitle className="text-2xl">$48,210</CardTitle>
              </CardHeader>
              <CardPanel className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="success">+12.4%</Badge>
                  <Badge variant="info">Q3</Badge>
                  <Badge variant="warning">2 项待处理</Badge>
                  <Badge variant="secondary">USD</Badge>
                </div>
                <Progress value={68} aria-label="演示目标">
                  <ProgressTrack>
                    <ProgressIndicator />
                  </ProgressTrack>
                </Progress>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Avatar className="size-6">
                    <AvatarFallback className="text-xs">AK</AvatarFallback>
                  </Avatar>
                  已完成季度目标的 68%
                </div>
              </CardPanel>
            </Card>
            <Alert variant="info">
              <InfoIcon />
              <AlertTitle>部署完成</AlertTitle>
              <AlertDescription>
                <span className="flex items-center gap-1">
                  <CheckIcon className="size-3.5" /> 全部检查已通过。
                </span>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  )
}
