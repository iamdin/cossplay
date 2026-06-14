/**
 * WCAG contrast checking, ported from tweakcn `utils/contrast-checker.ts` +
 * the pair/category config in `components/editor/contrast-checker.tsx`.
 *
 * 字节对齐 tweakcn:culori `wcagLuminance` + 标准对比度公式。tweakcn 原函数返回
 * 字符串(toFixed(2)),这里返回 number 以便上层直接比较/格式化。无法解析的颜色
 * 亮度按 0 计(同 tweakcn),两者皆 0 时比值为 1。Panel-side only — culori 可用。
 */
import * as culori from "culori";
import type { ThemeStyleProps } from "./theme-model";

export const MIN_CONTRAST_RATIO = 4.5;

/** WCAG 相对亮度(0-1);无法解析回退 0(同 tweakcn)。 */
function getLuminance(colorValue: string): number {
  try {
    const color = culori.parse(colorValue);
    if (!color) {
      console.warn(`Invalid color: ${colorValue}`);
      return 0;
    }
    return culori.wcagLuminance(color);
  } catch (error) {
    console.error(`Error calculating luminance: ${colorValue}`, error);
    return 0;
  }
}

/** 两色 WCAG 对比度比值(maxL+0.05)/(minL+0.05)。 */
export function getContrastRatio(foreground: string, background: string): number {
  try {
    const lum1 = getLuminance(foreground);
    const lum2 = getLuminance(background);
    return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  } catch (error) {
    console.error(
      `Error calculating contrast between ${foreground} and ${background}:`,
      error
    );
    return 1; // Fallback value indicating low contrast
  }
}

export interface ContrastPair {
  label: string;
  foregroundId: keyof ThemeStyleProps;
  backgroundId: keyof ThemeStyleProps;
}

export interface ContrastCategory {
  name: string;
  pairs: ContrastPair[];
}

/**
 * 3 类共 11 对,从 tweakcn contrast-checker 的 colorPairsToCheck 提取为数据。
 * label / 分类名沿用 tweakcn 原文案。
 */
export const CONTRAST_CATEGORIES: ContrastCategory[] = [
  {
    name: "Content & Containers",
    pairs: [
      { label: "Base", foregroundId: "foreground", backgroundId: "background" },
      { label: "Card", foregroundId: "card-foreground", backgroundId: "card" },
      { label: "Popover", foregroundId: "popover-foreground", backgroundId: "popover" },
      { label: "Muted", foregroundId: "muted-foreground", backgroundId: "muted" },
    ],
  },
  {
    name: "Interactive Elements",
    pairs: [
      { label: "Primary", foregroundId: "primary-foreground", backgroundId: "primary" },
      { label: "Secondary", foregroundId: "secondary-foreground", backgroundId: "secondary" },
      { label: "Accent", foregroundId: "accent-foreground", backgroundId: "accent" },
    ],
  },
  {
    name: "Navigation & Functional",
    pairs: [
      {
        label: "Destructive",
        foregroundId: "destructive-foreground",
        backgroundId: "destructive",
      },
      { label: "Sidebar Base", foregroundId: "sidebar-foreground", backgroundId: "sidebar" },
      {
        label: "Sidebar Primary",
        foregroundId: "sidebar-primary-foreground",
        backgroundId: "sidebar-primary",
      },
      {
        label: "Sidebar Accent",
        foregroundId: "sidebar-accent-foreground",
        backgroundId: "sidebar-accent",
      },
    ],
  },
];
