"use client";

/**
 * 🏪 商户后台 Layout
 * 为所有 /merchant/* 页面提供 MerchantProvider
 * 确保门店数据源统一：一个 context → 所有页面
 */

import { type ReactNode } from "react";
import { MerchantProvider } from "@/lib/merchant-context";

export default function MerchantLayout({ children }: { children: ReactNode }) {
  return <MerchantProvider>{children}</MerchantProvider>;
}
