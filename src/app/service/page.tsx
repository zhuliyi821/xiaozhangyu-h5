"use client";

/**
 * 🏪 服务号 — 单页底栏入口
 * 仅4Tab导航：首页 / AI助理 / 加豆站 / 服务
 */

import { usePathname } from "next/navigation";
import Link from "next/link";

// ─── 底部 Tab ───
const BOTTOM_TABS = [
  { icon: "🏠", label: "首页", href: "/service" },
  { icon: "💬", label: "AI助理", href: "/ai" },
  { icon: "💰", label: "加豆站", href: "/jiadouzhan" },
  { icon: "🏪", label: "服务", href: "/service#products" },
];

export default function ServicePage() {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-bg pb-20">
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="text-4xl mb-4">🏪</div>
        <h1 className="text-lg font-semibold text-text-primary mb-2">智能服务号</h1>
        <p className="text-[12px] text-text-tertiary mb-6">请使用底部导航选择功能</p>
        <div className="grid grid-cols-4 gap-3 w-full max-w-xs">
          {BOTTOM_TABS.map((tab, i) => (
            <Link key={i} href={tab.href}
              className="flex flex-col items-center gap-1.5 p-3 rounded-[10px] bg-white border border-brand-teal/10 active:scale-95 transition-transform shadow-sm">
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[9px] font-medium text-text-secondary">{tab.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════ 底部导航栏 ═══════ */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[64px] bg-white/90 backdrop-blur-[20px] saturate-180 border-t border-brand-teal/10 flex justify-around items-start pt-[6px] z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
        {BOTTOM_TABS.map((tab, i) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href.split("#")[0]);
          return (
            <Link key={i} href={tab.href}
              className="flex flex-col items-center gap-[2px] px-3 py-[2px] rounded-xl active:scale-90 transition-transform relative">
              <div className={`w-7 h-7 flex items-center justify-center text-xl transition-all duration-300 ${
                isActive ? "bg-gradient-to-br from-brand-teal to-brand-teal-dark rounded-xl text-white shadow-[0_2px_8px_rgba(69,204,213,0.3)]" : ""
              }`}>
                <span className="text-[16px] leading-none">{tab.icon}</span>
              </div>
              <span className={`text-[10px] font-medium transition-colors ${
                isActive ? "text-brand-teal-dark font-semibold" : "text-gray-400"
              }`}>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
