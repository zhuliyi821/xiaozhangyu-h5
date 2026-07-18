"use client";

/** 🏟️ PK 段位排行榜 — PK玩家胜率/场次/盈利排名 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/config/api";
import LoginModal from "@/components/ui/login-modal";

interface PKPlayer {
  rank: number;
  uid: number;
  nickname: string;
  avatar: string;
  total_bets: number;
  wins: number;
  losses: number;
  win_rate: number;
  net_profit: number;
}

const WIN_RATE_COLOR = (rate: number) =>
  rate >= 70 ? 'text-green-600' : rate >= 50 ? 'text-amber-600' : 'text-text-tertiary';

export default function PKRankPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [players, setPlayers] = useState<PKPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [myStat, setMyStat] = useState<PKPlayer | null>(null);

  useEffect(() => {
    apiFetch<PKPlayer[]>("/api/pk/rank?limit=100")
      .then(d => setPlayers(d))
      .catch(() => console.warn("请求 失败"))
      .finally(() => setLoading(false));

    if (user?.uid) {
      apiFetch<PKPlayer>(`/api/pk/rank?uid=${user.uid}`)
        .then(d => setMyStat(d))
        .catch(() => console.warn("请求 失败"));
    }
  }, [user?.uid]);

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-rose-600 text-white px-5 pt-4 pb-6 rounded-b-[24px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[22px]">🏟️</span>
          <div>
            <h1 className="text-lg font-bold">PK 段位排行</h1>
            <div className="text-[11px] opacity-80">{players.length} 位玩家</div>
          </div>
        </div>

        {/* My PK Stats */}
        {user && myStat && (
          <div className="mt-3 bg-white/10 rounded-[12px] p-3 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
              ${myStat.rank <= 3 ? 'bg-amber-300 text-amber-900' : myStat.rank <= 10 ? 'bg-white/20 text-white' : 'bg-white/10'}`}>
              {myStat.rank <= 3 ? ['👑','🥈','🥉'][myStat.rank - 1] : `#${myStat.rank}`}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium">{myStat.nickname}</div>
              <div className="text-[10px] opacity-70">
                {myStat.total_bets}场 · {myStat.wins}胜{myStat.losses}负 · {myStat.win_rate}%胜率
              </div>
            </div>
            <div className="text-right">
              <div className={`text-[14px] font-bold ${myStat.net_profit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {myStat.net_profit >= 0 ? '+' : ''}{myStat.net_profit}
              </div>
              <div className="text-[9px] opacity-60">盈利</div>
            </div>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="mx-4 -mt-3 grid grid-cols-3 gap-2 relative z-10">
        {[
          { label: "总场次", value: myStat?.total_bets ?? 0, icon: "⚔️" },
          { label: "胜率", value: myStat ? `${myStat.win_rate}%` : '0%', icon: "🎯" },
          { label: "盈利", value: myStat ? `${myStat.net_profit >= 0 ? '+' : ''}${myStat.net_profit}` : '0', icon: "💰" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-[10px] p-2.5 text-center shadow-sm border border-gray-100">
            <div className="text-[16px]">{s.icon}</div>
            <div className="text-[14px] font-bold mt-0.5">{s.value}</div>
            <div className="text-[8px] text-text-tertiary">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ranking list */}
      <div className="mx-4 mt-4 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-text-tertiary">玩家排行 · 按胜率排序</span>
        </div>

        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-[10px] p-3.5 animate-pulse border border-gray-100 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-100" />
              <div className="flex-1 space-y-1"><div className="h-3 w-20 bg-gray-100 rounded" /><div className="h-3 w-28 bg-gray-50 rounded" /></div>
              <div className="h-5 w-10 bg-gray-100 rounded" />
            </div>
          ))
        ) : players.length === 0 ? (
          <div className="bg-white rounded-[12px] p-8 text-center border border-gray-100">
            <div className="text-4xl mb-2">🏟️</div>
            <div className="text-[13px] font-medium mb-1">暂无PK数据</div>
            <div className="text-[11px] text-text-tertiary">参与PK预测即可上榜</div>
          </div>
        ) : (
          players.map((p) => (
            <div key={p.uid}
              className={`bg-white rounded-[10px] p-3.5 shadow-sm border flex items-center gap-3 active:scale-[0.98] transition-transform ${
                p.uid === user?.uid ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-100'
              }`}>
              {/* Rank */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                p.rank === 1 ? 'bg-amber-100 text-amber-700' :
                p.rank === 2 ? 'bg-gray-100 text-gray-600' :
                p.rank === 3 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-50 text-text-tertiary'
              }`}>
                {p.rank <= 3 ? ['👑','🥈','🥉'][p.rank - 1] : `#${p.rank}`}
              </div>

              {/* Avatar + Name */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center text-[14px] shrink-0">
                {p.avatar || '🐙'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate">
                  {p.nickname}
                  {p.uid === user?.uid && <span className="ml-1 text-[8px] bg-orange-100 text-orange-600 px-1 py-0.5 rounded-[3px]">我</span>}
                </div>
                <div className="text-[9px] text-text-tertiary">{p.total_bets}场 · {p.wins}胜{p.losses}负</div>
              </div>

              {/* Win Rate + Profit */}
              <div className="text-right">
                <div className={`text-[13px] font-bold ${WIN_RATE_COLOR(p.win_rate)}`}>{p.win_rate}%</div>
                <div className={`text-[9px] ${p.net_profit >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                  {p.net_profit >= 0 ? '+' : ''}{p.net_profit}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
