"use client";

/**
 * 📋 我的活动 — 统一展示用户发起的PK / 围观的 / 投注的记录
 *
 * Tab 1: 我发起的 (my_topics)
 * Tab 2: 我围观的 (my_spectates)
 * Tab 3: 我投注的 (my_bets)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import LoginModal from "@/components/ui/login-modal";
import { ArrowLeft, Loader2 } from "lucide-react";
import { C } from "@/lib/brand-colors";

type Topic = {
  id: number;
  title: string;
  option_a: string;
  option_b: string;
  category: string;
  status: number;
  vote_a: number;
  vote_b: number;
  pool_a: number;
  pool_b: number;
  bet_count?: number;
  spectator_count: number;
  winner: string | null;
  created_at: string;
  end_time?: string | null;
  // bet-specific fields
  pk_id?: number;
  option_choice?: string;
  bet_amount?: number;
  reward_amount?: number;
  settled?: number;
  is_win?: boolean;
  topic_status?: number;
  // spectate-specific
  spectate_at?: string;
};

const TAB_CONFIG = [
  { key: "topics", label: "📋 我发起的", icon: "📋", action: "my_topics" },
  { key: "spectates", label: "👀 我围观的", icon: "👀", action: "my_spectates" },
  { key: "bets", label: "🎲 我投注的", icon: "🎲", action: "my_bets" },
];

function statusBadge(status: number, winner: string | null): { label: string; cls: string } {
  if (status === 1) return { label: "进行中", cls: "bg-brand-teal/10 text-brand-teal-dark" };
  if (status === 2) return { label: "已截止", cls: "bg-amber-50 text-amber-600" };
  if (status === 3) return { label: winner ? `已结算·${winner === "A" ? "A方胜" : "B方胜"}` : "已结算", cls: "bg-gray-50 text-text-tertiary" };
  return { label: "未知", cls: "bg-gray-50 text-text-tertiary" };
}

export default function ActivitiesPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("topics");
  const [data, setData] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  const activeCfg = TAB_CONFIG.find(t => t.key === activeTab)!;

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const action = activeCfg.action;
    fetch(`${API_BASE}/api/pk?action=${action}&uid=${user.uid}`)
      .then(r => r.json())
      .then(json => {
        setData(json.data || []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [activeTab, user]);

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-brand-teal/10">
        <div className="flex items-center px-4 h-12 gap-2">
          <button onClick={() => window.history.back()} className="text-text-secondary text-lg">‹</button>
          <h1 className="text-base font-semibold flex-1">我的活动</h1>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto scrollbar-none">
          {TAB_CONFIG.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-[8px] text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-brand-teal text-white shadow-sm"
                  : "bg-surface text-text-secondary border border-brand-teal/10"
              }`}>
              {tab.icon} {tab.label.replace(/^[^\s]+\s/, "")}
            </button>
          ))}
        </div>
      </div>

      {/* Login prompt */}
      {!authLoading && !user && (
        <div className="p-6 text-center pt-20">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-text-secondary mb-4">登录后查看你的活动记录</p>
          <button onClick={() => setShowLogin(true)}
            className="px-6 py-2.5 rounded-[8px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-sm font-medium shadow-sm">
            立即登录
          </button>
          {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </div>
      )}

      {/* Loading */}
      {user && loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-teal" />
        </div>
      )}

      {/* Empty state */}
      {user && !loading && data.length === 0 && (
        <div className="p-6 text-center pt-20">
          <div className="text-4xl mb-3">
            {activeTab === "topics" && "📋"}
            {activeTab === "spectates" && "👀"}
            {activeTab === "bets" && "🎲"}
          </div>
          <p className="text-text-secondary mb-2">
            {activeTab === "topics" && "还没有发起过PK话题"}
            {activeTab === "spectates" && "还没有围观过PK话题"}
            {activeTab === "bets" && "还没有投注记录"}
          </p>
          <Link href="/pk-hall"
            className="inline-block px-5 py-2 rounded-[8px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-xs font-medium shadow-sm">
            去PK大厅
          </Link>
        </div>
      )}

      {/* Data list */}
      {user && !loading && data.length > 0 && (
        <div className="px-4 pt-3 flex flex-col gap-2.5">
          {data.map((item) => {
            const badge = statusBadge(
              activeTab === "bets" ? (item.topic_status ?? item.status) : item.status,
              item.winner
            );
            const isBet = activeTab === "bets";
            const isWin = isBet && item.is_win;
            const href = `/pk-hall/${item.category || "general"}/${item.pk_id || item.id}`;

            return (
              <Link key={item.id} href={href}
                className="block bg-white rounded-[10px] border border-brand-teal/10 p-3.5 active:scale-[0.98] transition-transform shadow-sm">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-[13px] font-semibold text-text-primary leading-snug flex-1 line-clamp-2">
                    {item.title}
                  </h3>
                  <span className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Options */}
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 bg-brand-coral/5 rounded-[6px] px-2.5 py-1.5 border border-brand-coral/10">
                    <div className="text-[10px] text-brand-coral-dark font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-brand-coral" />
                      {item.option_a}
                    </div>
                    {item.pool_a > 0 && (
                      <div className="text-[9px] text-text-tertiary mt-0.5">奖池: {item.pool_a}⛏️</div>
                    )}
                  </div>
                  <div className="flex-1 bg-brand-teal/5 rounded-[6px] px-2.5 py-1.5 border border-brand-teal/10">
                    <div className="text-[10px] text-brand-teal-dark font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-brand-teal" />
                      {item.option_b}
                    </div>
                    {item.pool_b > 0 && (
                      <div className="text-[9px] text-text-tertiary mt-0.5">奖池: {item.pool_b}⛏️</div>
                    )}
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="flex items-center gap-3 text-[9px] text-text-tertiary">
                  {isBet && (
                    <>
                      <span>投注: <span className={isWin ? "text-brand-coral font-semibold" : ""}>
                        {item.bet_amount}🎮
                      </span></span>
                      {item.settled === 1 && (
                        <span className={isWin ? "text-brand-coral font-semibold" : "text-text-tertiary"}>
                          {isWin ? `🏆 +${item.reward_amount}🎮` : "❌ 未中"}
                        </span>
                      )}
                    </>
                  )}
                  {activeTab === "topics" && (
                    <span>参与: {item.bet_count}人</span>
                  )}
                  {activeTab === "spectates" && (
                    <>
                      <span>围观于 {item.spectate_at}</span>
                    </>
                  )}
                  <span>围观 {item.spectator_count}</span>
                  <span className="ml-auto">{item.created_at}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
