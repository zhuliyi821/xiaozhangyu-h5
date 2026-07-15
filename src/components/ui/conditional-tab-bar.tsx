"use client";

import { usePathname } from "next/navigation";
import { TabBar } from "./tab-bar";

/** 
 * 隐藏 TabBar 的路径前缀
 * 优先级：精确匹配 > 前缀匹配 > 多段路径
 */
const HIDE_PREFIXES = [
  // 页面自有 TabBar，避免重复
  "/service",
  // 独立/嵌入模式
  "/pk-hall-solo",
  "/pk-hall/standalone",
  // 详情页/操作页（无全局导航需求）
  "/store/",
  "/btc",
  "/btc-predict",
  "/lottery-sim",
  "/daily-fortune",
  "/stock-analysis",
  "/divination",
  "/exchange",
  "/checkout/",
  "/draw",
  "/calculator",
  "/agent",
  "/coupons",
  "/messages",
  "/orders",
  "/settings",
  "/admin/",
];

export default function ConditionalTabBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // 多段路径 → [store]/xxx 子页面，隐藏 TabBar
  if (segments.length >= 2) {
    // 例外：某些已知二段路径需要 TabBar（目前无）
    return null;
  }

  // 一段路径 → 检查是否在隐藏列表
  if (HIDE_PREFIXES.some(p => pathname.startsWith(p))) {
    return null;
  }

  return <TabBar />;
}
