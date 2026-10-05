import type { ColorFormat } from "@coss-tweak/theme-core"
import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 * 导出偏好（颜色格式 / 包管理器）。
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
