/**
 * 小章鱼统一品牌色
 * 所有页面从本模块引用，禁止硬编码品牌色值。
 *
 * 使用方式：
 *   import { C } from "@/lib/brand-colors";
 *   <div style={{ color: C.teal }} />
 *
 * 对于 Canvas/SVG 绘制，使用 getBrandColor() 动态获取：
 *   import { getBrandColor } from "@/lib/brand-colors";
 *   ctx.fillStyle = getBrandColor("teal");
 */

// ===== 品牌色常量（供 inline style / Canvas / SVG 使用） =====
export const C = {
  coral: "#F27152",
  coralLight: "#FABAA8",
  coralDark: "#D45435",
  coralDarkest: "#712B13",

  teal: "#45CCD5",
  tealLight: "#A0EDF2",
  tealDark: "#2BAAAF",
  tealDarkest: "#085041",

  gold: "#F2B631",
  goldLight: "#FCE7A8",
  goldDark: "#D99A0F",

  bg: "#F0F6F7",
  pageBg: "#F5F6FA",
  white: "#FFFFFF",

  ballFront: "#F27152",
  ballBack: "#45CCD5",

  /* 辅助色（非品牌调色板核心色，但页面中广泛使用） */
  purple: "#8B5CF6",
  green: "#10B981",
} as const;

type BrandKey = keyof typeof C;

/**
 * 从 CSS 变量动态获取品牌色（支持主题切换）
 * 回退到常量值
 */
export function getBrandColor(key: BrandKey): string {
  const cssVarMap: Record<string, string | null> = {
    coral: "--color-brand-coral",
    coralLight: "--color-brand-coral-light",
    coralDark: "--color-brand-coral-dark",
    coralDarkest: "--color-brand-coral-darkest",
    teal: "--color-brand-teal",
    tealLight: "--color-brand-teal-light",
    tealDark: "--color-brand-teal-dark",
    tealDarkest: "--color-brand-teal-darkest",
    gold: "--color-brand-gold",
    goldLight: "--color-brand-gold-light",
    goldDark: "--color-brand-gold-dark",
    bg: "--color-bg",
    white: null,
    ballFront: "--color-ball-front",
    ballBack: "--color-ball-back",
    purple: null,
    green: null,
    pageBg: null,
  };

  const varName = cssVarMap[key];
  if (!varName) return C[key];
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || C[key];
}

/**
 * Canvas 专用：解析品牌色为 RGB 分量
 * 用于 ctx.fillStyle = `rgba(${r},${g},${b},0.5)`
 */
export function getBrandRGB(key: BrandKey): { r: number; g: number; b: number } {
  const hex = getBrandColor(key);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}
