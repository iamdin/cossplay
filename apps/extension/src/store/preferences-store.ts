import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ColorFormat } from "@coss-tweak/theme-core"

/**
 * 导出偏好（颜色格式 / 包管理器）。
 * 从 tweakcn `store/preferences-store.ts` 移植；coss ui 基于 Tailwind v4，不再提供 v3 导出。
 */

type PackageManager = "pnpm" | "npm" | "yarn" | "bun"

interface PreferencesStore {
  colorFormat: ColorFormat
  packageManager: PackageManager
  setColorFormat: (format: ColorFormat) => void
  setPackageManager: (pm: PackageManager) => void
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      colorFormat: "oklch",
      packageManager: "pnpm",
      setColorFormat: (format: ColorFormat) => set({ colorFormat: format }),
      setPackageManager: (pm: PackageManager) => set({ packageManager: pm }),
    }),
    {
      name: "preferences-storage",
    }
  )
)
