import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ColorFormat } from "theme-core"

/**
 * 导出偏好（Tailwind 版本 / 颜色格式 / 包管理器）。
 * 从 tweakcn `store/preferences-store.ts` 移植，仅保留代码导出面板需要的字段。
 */

type PackageManager = "pnpm" | "npm" | "yarn" | "bun"

// 各 Tailwind 版本可用的颜色格式（v3 无 oklch）。
const colorFormatsByVersion = {
  "3": ["hex", "rgb", "hsl"] as const,
  "4": ["hex", "rgb", "hsl", "oklch"] as const,
}

interface PreferencesStore {
  tailwindVersion: "3" | "4"
  colorFormat: ColorFormat
  packageManager: PackageManager
  setTailwindVersion: (version: "3" | "4") => void
  setColorFormat: (format: ColorFormat) => void
  setPackageManager: (pm: PackageManager) => void
  getAvailableColorFormats: () => readonly ColorFormat[]
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      tailwindVersion: "4",
      colorFormat: "oklch",
      packageManager: "pnpm",
      setTailwindVersion: (version: "3" | "4") => {
        const currentFormat = get().colorFormat
        // v3 不支持 oklch：切到 v3 时若当前是 oklch，回退到 hsl。
        if (version === "3" && currentFormat === "oklch") {
          set({ tailwindVersion: version, colorFormat: "hsl" })
        } else {
          set({ tailwindVersion: version })
        }
      },
      setColorFormat: (format: ColorFormat) => {
        const availableFormats = get().getAvailableColorFormats()
        if (availableFormats.includes(format)) {
          set({ colorFormat: format })
        }
      },
      setPackageManager: (pm: PackageManager) => {
        set({ packageManager: pm })
      },
      getAvailableColorFormats: () => {
        const version = get().tailwindVersion
        return colorFormatsByVersion[version]
      },
    }),
    {
      name: "preferences-storage",
    }
  )
)
