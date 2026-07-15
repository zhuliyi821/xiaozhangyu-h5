"use client";

/**
 * 🏪 服务号 — 功能入口页 + 4Tab底栏
 * 首页：功能入口网格 / AI助理 / 加豆站 / 服务
 */

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";

// ─── 功能入口 ───
const QUICK_ACTIONS = [
  { icon: "💬", label: "AI对话", color: "bg-brand-teal/10 text-brand-teal-dark", href: "/ai" },
  { icon: "📊", label: "经营看板", color: "bg-brand-coral/10 text-brand-coral-dark", href: "/merchant" },
  { icon: "📋", label: "任务中心", color: "bg-brand-gold/10 text-brand-gold-dark", href: "/tasks" },
  { icon: "🏆", label: "PK大厅", color: "bg-purple-50 text-purple-600", href: "/pk-hall" },
  { icon: "🎫", label: "开奖查询", color: "bg-green-50 text-green-600", href: "/draw" },
  { icon: "👤", label: "个人中心", color: "bg-blue-50 text-blue-600", href: "/profile" },
];

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
      {/* ═══════ 功能入口页内容 ═══════ */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-[12px] shadow-sm border border-brand-teal/10 p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="w-3.5 h-3.5 text-brand-teal" />
            <span className="text-[12px] font-semibold text-text-primary">快捷功能</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_ACTIONS.map((a, i) => (
              <Link key={i} href={a.href}
                className="flex flex-col items-center gap-1 p-2.5 rounded-[10px] active:scale-95 transition-transform">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${a.color}`}>
                  {a.icon}
                </div>
                <span className="text-[9px] font-medium text-text-secondary">{a.label}</span>
              </Link>
            ))}
          </div>
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
