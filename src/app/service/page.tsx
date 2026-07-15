"use client";

/**
 * 🏪 服务号首页 — 品牌头 + 用户卡 + 8格功能入口 + 门店合作 + 5Tab底栏
 */

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { TabBar } from "@/components/ui/tab-bar";

// ─── 8格功能入口 ───
const FUNC_GRID = [
  { icon: "🤖", label: "AI趣预测", sub: "智能分析", href: "/ai-predictions", color: "from-brand-teal to-brand-teal-dark" },
  { icon: "⚔️", label: "全民PK", sub: "有奖竞猜", href: "/pk-hall", color: "from-brand-coral to-brand-coral-dark" },
  { icon: "⚽", label: "省超竞猜", sub: "体育赛事", href: "/pk-hall?category=sports", color: "from-brand-gold to-amber-600" },
  { icon: "💎", label: "我的资产", sub: "总览明细", href: "/jiadouzhan", color: "from-purple-500 to-purple-700" },
  { icon: "📅", label: "每日签到", sub: "领游戏豆", href: "/tasks", color: "from-green-500 to-green-700" },
  { icon: "🔮", label: "今日运势", sub: "AI推演", href: "/daily-fortune", color: "from-amber-500 to-amber-700" },
  { icon: "📈", label: "股票期指", sub: "行情预测", href: "/stock-analysis", color: "from-blue-500 to-blue-700" },
  { icon: "₿", label: "BTC试玩", sub: "模拟交易", href: "/btc", color: "from-orange-500 to-orange-700" },
];

export default function ServicePage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* ═══════ 顶部导航条 ═══════ */}
      <div className="flex items-center justify-between px-4 py-2 bg-bg border-b border-brand-teal/5">
        <div className="text-[11px] text-text-tertiary font-medium">小章鱼 · AI趣预测</div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-tertiary">ws.hi.cn</span>
          <button className="text-text-tertiary text-sm">⋯</button>
        </div>
      </div>

      {/* ═══════ 品牌头 ═══════ */}
      <div className="bg-gradient-to-br from-brand-teal to-brand-teal-dark px-4 pt-6 pb-7 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/8" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🐙</span>
            <div>
              <h1 className="text-xl font-bold text-white">小章鱼</h1>
              <p className="text-[11px] text-white/70">AI趣预测 · 有奖PK · 赢水晶石</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ 用户卡片 ═══════ */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-[12px] p-4 shadow-sm border border-brand-teal/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center text-white text-sm shrink-0">
            {user?.nickname?.[0] || "😊"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-text-primary truncate">
              {user?.nickname || "游客"}
            </div>
            <div className="text-[11px] text-text-tertiary mt-0.5">
              {user ? `${(user.balance?.credit1 || 0).toLocaleString()} 游戏豆` : "登录解锁全部玩法"}
            </div>
          </div>
          <Link href={user ? "/profile" : "#"} onClick={e => { if (!user) { e.preventDefault(); setShowLogin(true); } }}
            className="flex items-center gap-0.5 text-[10px] text-brand-teal-dark font-medium shrink-0">
            个人中心 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ═══════ 8格功能入口 ═══════ */}
      <div className="px-4 mt-3">
        <div className="grid grid-cols-4 gap-2">
          {FUNC_GRID.map((f, i) => (
            <Link key={i} href={f.href}
              onClick={e => { if (!user && f.label !== "AI趣预测") { e.preventDefault(); setShowLogin(true); } }}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-[10px] bg-white border border-brand-teal/10 active:scale-95 transition-transform shadow-sm">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center text-sm shadow-sm`}>
                <span className="text-white">{f.icon}</span>
              </div>
              <span className="text-[9px] font-medium text-text-primary text-center truncate w-full">{f.label}</span>
              <span className="text-[7px] text-text-tertiary -mt-1">{f.sub}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════ 门店合作 ═══════ */}
      <div className="px-4 mt-3">
        <Link href="/merchant/cooperation"
          className="block bg-gradient-to-r from-brand-teal-dark to-brand-teal rounded-[12px] p-3.5 active:scale-[0.98] transition-transform shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl">🤝</div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-white">门店合作</div>
              <div className="text-[10px] text-white/70 mt-0.5">区域合伙人 · 门店入驻 · 供应厂商</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/50" />
          </div>
        </Link>
      </div>

      {/* ═══════ 底部占位 ═══════ */}
      <div className="px-4 mt-3 text-center py-4">
        <div className="text-[9px] text-text-tertiary/40">AI趣预测 · 仅娱乐参考 · 理性参与</div>
      </div>

      {/* 登录弹窗 */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* ═══════ 5Tab底栏 ═══════ */}
      <TabBar />
    </main>
  );
}
