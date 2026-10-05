import { cn } from "@coss-tweak/ui/lib/utils"
import { ChevronRight } from "lucide-react"
import { useState } from "react"
import { SectionContext } from "./section-context"

export type ControlSectionProps = {
  title: string
  children: React.ReactNode
  expanded?: boolean
  className?: string
  headerAction?: React.ReactNode
}

/**
 * Collapsible control section. Ported from tweakcn
 * `components/editor/control-section.tsx`; the only adaptation is inlining the
 * `ControlSectionProps` type (tweakcn kept it in `@/types`).
 */
const ControlSection = ({
  title,
  children,
  expanded = false,
  className,
  headerAction,
}: ControlSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(expanded)

  return (
    <SectionContext.Provider
      value={{
        isExpanded,
        setIsExpanded,
        toggleExpanded: () => setIsExpanded((prev) => !prev),
      }}
    >
      <div className="group/accordion">
        <div className="flex items-center gap-1 py-1">
          <button
            type="button"
            className="group/section flex items-center transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse section" : "Expand section"}
          >
            <div className="flex items-center gap-1 rounded-md border border-transparent bg-muted px-2 py-0.5 transition-all group-hover/section:bg-muted/80 group-has-focus-within/accordion:border-ring/50 group-has-focus-within/accordion:bg-muted/70">
              <ChevronRight
                className={cn(
                  "size-3 text-muted-foreground transition-transform duration-200",
                  isExpanded && "rotate-90"
                )}
              />
              <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                {title}
              </span>
            </div>
          </button>
          {headerAction}
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className={cn("flex flex-col pt-1 pb-2", className)}>
            {children}
          </div>
        </div>
      </div>
    </SectionContext.Provider>
  )
}

export default ControlSection
