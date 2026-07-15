"use client";

/**
 * 🏪 服务号 — 功能入口页 + 4Tab底栏
 * 首页：功能入口网格 / AI助理 / 加豆站 / 服务
 * 服务Tab：12产品矩阵
 */

import { useState } from "react";
import Link from "next/link";
import { Zap, Layers } from "lucide-react";

// ─── 功能入口 ───
const QUICK_ACTIONS = [
  { icon: "💬", label: "AI对话", color: "bg-brand-teal/10 text-brand-teal-dark", href: "/ai" },
  { icon: "📊", label: "经营看板", color: "bg-brand-coral/10 text-brand-coral-dark", href: "/merchant" },
  { icon: "📋", label: "任务中心", color: "bg-brand-gold/10 text-brand-gold-dark", href: "/tasks" },
  { icon: "🏆", label: "PK大厅", color: "bg-purple-50 text-purple-600", href: "/pk-hall" },
  { icon: "🎫", label: "开奖查询", color: "bg-green-50 text-green-600", href: "/draw" },
  { icon: "👤", label: "个人中心", color: "bg-blue-50 text-blue-600", href: "/profile" },
];

// ─── 12 大产品 ───
const PRODUCTS = [
  { icon: "🏪", name: "AI智慧门店", desc: "智能门店管理·7x24AI客服", color: "from-brand-teal to-brand-teal-dark", href: "/merchant" },
  { icon: "🛒", name: "A2A智能SaaS商城", desc: "AI驱动·全渠道电商解决方案", color: "from-brand-coral to-brand-coral-dark", href: "/marketplace" },
  { icon: "🤝", name: "AI异业联盟平台", desc: "跨界合作·流量共享·互利共赢", color: "from-purple-500 to-purple-700", href: "/merchant/cooperation" },
  { icon: "🏭", name: "A2A智能产业平台", desc: "产业互联·供应链智能升级", color: "from-blue-500 to-blue-700", href: "/marketplace/cooperation" },
  { icon: "☯", name: "AI周易八卦", desc: "AI推演·每日运势·命理分析", color: "from-amber-500 to-amber-700", href: "/divination" },
  { icon: "📈", name: "AI股市分析", desc: "实时行情·技术面AI解读", color: "from-brand-gold to-brand-gold-dark", href: "/stock-analysis" },
  { icon: "🎰", name: "AI彩票分析", desc: "冷热号追踪·智能推荐策略", color: "from-green-500 to-green-700", href: "/lottery-sim" },
  { icon: "🦞", name: "AI小龙虾", desc: "门店AI员工·智能经营助手", color: "from-red-500 to-red-700", href: "/agent" },
  { icon: "🐎", name: "AI爱马仕", desc: "赛马预测·赔率分析·策略推荐", color: "from-pink-500 to-pink-700", href: "/agent?persona=horse" },
  { icon: "🎯", name: "数字碰游戏", desc: "实时PK·赢家瓜分奖池", color: "from-brand-teal to-cyan-700", href: "/lottery-sim?game=number-hit" },
  { icon: "💰", name: "投资模拟", desc: "虚拟投资·策略验证·风控训练", color: "from-emerald-500 to-emerald-700", href: "/calculator" },
  { icon: "🔗", name: "区块链开发", desc: "DApp开发·智能合约·Web3方案", color: "from-indigo-500 to-indigo-700", href: "/store-services" },
];

type TabKey = "home" | "services";

export default function ServicePage() {
  const [tab, setTab] = useState<TabKey>("home");

  return (
    <main className="min-h-screen bg-bg pb-20">
      {/* ═══════ 首页：功能入口 ═══════ */}
      {tab === "home" && (
        <div className="px-4 pt-4">
          <div className="bg-white rounded-[12px] shadow-sm border border-brand-teal/10 p-3">
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
      )}

      {/* ═══════ 服务Tab：产品矩阵 ═══════ */}
      {tab === "services" && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-1.5 mb-2.5 px-1">
            <Layers className="w-3.5 h-3.5 text-brand-teal" />
            <span className="text-[12px] font-semibold text-text-primary">产品矩阵</span>
            <span className="text-[8px] text-text-tertiary ml-auto">{PRODUCTS.length} 款产品</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRODUCTS.map((p, i) => (
              <Link key={i} href={p.href}
                className="bg-white rounded-[10px] border border-brand-teal/10 p-3 active:scale-[0.97] transition-transform shadow-sm">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center text-sm mb-2 shadow-sm`}>
                  <span className="text-white">{p.icon}</span>
                </div>
                <h3 className="text-[11px] font-semibold text-text-primary mb-0.5">{p.name}</h3>
                <p className="text-[8px] text-text-tertiary leading-relaxed">{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ 底部导航栏 ═══════ */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[64px] bg-white/90 backdrop-blur-[20px] saturate-180 border-t border-brand-teal/10 flex justify-around items-start pt-[6px] z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
        <button onClick={() => setTab("home")}
          className="flex flex-col items-center gap-[2px] px-3 py-[2px] rounded-xl active:scale-90 transition-transform relative">
          <div className={`w-7 h-7 flex items-center justify-center text-xl transition-all duration-300 ${tab === "home" ? "bg-gradient-to-br from-brand-teal to-brand-teal-dark rounded-xl text-white shadow-[0_2px_8px_rgba(69,204,213,0.3)]" : ""}`}>
            <span className="text-[16px] leading-none">🏠</span>
          </div>
          <span className={`text-[10px] font-medium transition-colors ${tab === "home" ? "text-brand-teal-dark font-semibold" : "text-gray-400"}`}>首页</span>
        </button>

        <Link href="/ai"
          className="flex flex-col items-center gap-[2px] px-3 py-[2px] rounded-xl active:scale-90 transition-transform relative">
          <div className="w-7 h-7 flex items-center justify-center text-xl">
            <span className="text-[16px] leading-none">💬</span>
          </div>
          <span className="text-[10px] font-medium text-gray-400">AI助理</span>
        </Link>

        <Link href="/jiadouzhan"
          className="flex flex-col items-center gap-[2px] px-3 py-[2px] rounded-xl active:scale-90 transition-transform relative">
          <div className="w-7 h-7 flex items-center justify-center text-xl">
            <span className="text-[16px] leading-none">💰</span>
          </div>
          <span className="text-[10px] font-medium text-gray-400">加豆站</span>
        </Link>

        <button onClick={() => setTab("services")}
          className="flex flex-col items-center gap-[2px] px-3 py-[2px] rounded-xl active:scale-90 transition-transform relative">
          <div className={`w-7 h-7 flex items-center justify-center text-xl transition-all duration-300 ${tab === "services" ? "bg-gradient-to-br from-brand-teal to-brand-teal-dark rounded-xl text-white shadow-[0_2px_8px_rgba(69,204,213,0.3)]" : ""}`}>
            <span className="text-[16px] leading-none">🏪</span>
          </div>
          <span className={`text-[10px] font-medium transition-colors ${tab === "services" ? "text-brand-teal-dark font-semibold" : "text-gray-400"}`}>服务</span>
        </button>
      </nav>
    </main>
  );
}
