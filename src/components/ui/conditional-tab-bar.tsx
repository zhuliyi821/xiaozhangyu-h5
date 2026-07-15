"use client";

import { usePathname } from "next/navigation";
import { TabBar } from "./tab-bar";

const HIDE_TAB_BAR_PATHS = [
  "/pk-hall-solo",
  "/pk-hall/standalone",
  "/service",
  "/btc",
  "/btc-predict",
  "/lottery-sim",
  "/daily-fortune",
  "/stock-analysis",
  "/divination",
  "/exchange",
  "/checkout",
  "/draw",
  "/calculator",
  "/agent",
  "/coupons",
  "/messages",
  "/orders",
  "/settings",
  "/admin",
];

export default function ConditionalTabBar() {
  const pathname = usePathname();

  // Hide tab bar on standalone/embed routes
  if (HIDE_TAB_BAR_PATHS.some(p => pathname.startsWith(p))) {
    return null;
  }

  return <TabBar />;
}
