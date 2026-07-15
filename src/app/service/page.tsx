"use client";

/**
 * 🐙 服务号 — 小章鱼·AI趣预测 品牌首页
 * 100% 对齐图版：顶栏+品牌头+用户卡+功能入口+门店合作+底栏
 */

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { TabBar } from "@/components/ui/tab-bar";

// ─── 8格功能入口 ───
const FUNC_GRID = [
  { icon: "🤖", label: "AI趣预测", sub: "AI驱动·全民预测", color: "from-red-400 to-red-600" },
  { icon: "🔥", label: "全民PK", sub: "发起话题赢奖励", color: "from-orange-400 to-orange-600" },
  { icon: "⚽", label: "省超竞猜", sub: "12种玩法赢水晶石", color: "from-amber-400 to-amber-600" },
  { icon: "💰", label: "我的资产", sub: "游戏豆·水晶石·余额", color: "from-green-400 to-green-600" },
  { icon: "📅", label: "每日签到", sub: "签到得游戏豆", color: "from-purple-400 to-purple-600" },
  { icon: "🔮", label: "今日运势", sub: "每日幸运指南", color: "from-pink-400 to-pink-600" },
  { icon: "📈", label: "股票期指", sub: "AI量化分析", color: "from-blue-400 to-blue-600" },
  { icon: "₿", label: "BTC试玩", sub: "模拟交易赚水晶石", color: "from-orange-500 to-orange-700" },
];

export default function ServicePage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* ═══════ 顶部导航条 ═══════ */}
      <div className="flex items-center justify-between px-4 py-3 bg-bg">
        <button className="w-7 h-7 flex items-center justify-center text-text-primary">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-[13px] font-medium text-text-primary">小章鱼 · AI趣预测</div>
          <div className="text-[10px] text-text-tertiary mt-0.5">ws.hi.cn</div>
        </div>
        <button className="w-7 h-7 flex items-center justify-center text-text-primary text-base">
          ⋯
        </button>
      </div>

      {/* ═══════ 品牌头 (渐变+章鱼+标题) ═══════ */}
      <div className="bg-gradient-to-br from-teal-200 via-cyan-200 to-teal-300 px-4 pt-6 pb-12 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/15" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute top-6 right-8 w-20 h-20 rounded-full bg-white/20" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center text-3xl shadow-sm mb-3">
            🐙
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">小章鱼</h1>
          <p className="text-[11px] text-text-secondary">AI趣预测 · 有奖PK · 赢水晶石</p>
        </div>
      </div>

      {/* ═══════ 用户卡片（悬浮在品牌头上） ═══════ */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-[12px] p-3.5 shadow-md border border-brand-teal/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-pink-300 flex items-center justify-center text-white text-xs shrink-0">
            🌎
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-text-primary">
              {user?.nickname || "欧阳理旺"}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-text-tertiary">🕹</span>
              <span className="text-[10px] text-text-tertiary">
                {user ? `${(user.balance?.credit1 || 0).toLocaleString()} 游戏豆` : "0 游戏豆"}
              </span>
            </div>
          </div>
          <Link href={user ? "/profile" : "#"} onClick={e => { if (!user) { e.preventDefault(); setShowLogin(true); } }}
            className="flex items-center gap-0.5 text-[10px] text-brand-teal-dark font-medium shrink-0">
            个人中心 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ═══════ 功能入口 ═══════ */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 rounded-full bg-brand-teal" />
          <span className="text-[14px] font-semibold text-text-primary">功能入口</span>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {FUNC_GRID.map((f, i) => (
            <Link key={i} href={f.href}
              onClick={e => { if (!user && f.label !== "AI趣预测") { e.preventDefault(); setShowLogin(true); } }}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-[12px] bg-white border border-gray-100 active:scale-95 transition-transform shadow-sm">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-lg shadow-md`}>
                <span className="text-white">{f.icon}</span>
              </div>
              <span className="text-[11px] font-semibold text-text-primary text-center mt-0.5">{f.label}</span>
              <span className="text-[8px] text-text-tertiary text-center -mt-1 leading-tight">{f.sub}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════ 门店合作 ═══════ */}
      <div className="px-4 mt-3">
        <Link href="/merchant/cooperation"
          className="block bg-gray-50 rounded-[12px] p-3.5 active:scale-[0.98] transition-transform border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg border border-gray-200">
              🏪
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-text-primary">门店合作</div>
              <div className="text-[10px] text-text-tertiary mt-0.5">区域合伙人 · 门店入驻 · 供应厂商</div>
            </div>
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          </div>
        </Link>
      </div>

      {/* 登录弹窗 */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* ═══════ 5Tab底栏（主 app 的 TabBar） ═══════ */}
      <TabBar />
    </main>
  );
}
