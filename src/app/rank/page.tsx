"use client";

/** 🏆 预测排行榜 v2 — 支持双排序 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/config/api";
import LoginModal from "@/components/ui/login-modal";

interface RankItem {
  rank: number;
  name: string;
  nickname: string;
  avatar: string;
  total_bets: number;
  wins: number;
  accuracy: number;
  won: number;
  stats: string;
  isCrown: boolean;
  uid: number;
}

export default function RankPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"accuracy" | "bets">("accuracy");
  const [showLogin, setShowLogin] = useState(false);

  const fetchRank = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<RankItem[]>(`/api/leaderboard?limit=50&sort_by=${tab}`);
      setData(res);
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchRank(); }, [fetchRank]);

  // 用户自己的排名
  const myRank = data.find(r => r.uid === user?.uid);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — 品牌色统一 */}
      <div className="bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-teal-darkest text-white px-5 pt-4 pb-6 rounded-b-[24px]">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold">🏆 预测排行榜</h1>
          <span className="text-[11px] bg-white/15 rounded-[8px] px-3 py-1">
            {data.length} 人上榜
          </span>
        </div>

        {/* 我的排名 */}
        {user ? (
          <div className="bg-white/10 rounded-[12px] p-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${myRank?.isCrown ? 'bg-amber-300 text-amber-900' : 'bg-white/20'}`}>
              {myRank ? `#${myRank.rank}` : '—'}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium">{myRank?.name || user.nickname}</div>
              <div className="text-[10px] opacity-70">{myRank ? myRank.stats : '暂无预测记录'}</div>
            </div>
            {myRank && (
              <div className="text-[14px] font-bold text-amber-200">
                {tab === "accuracy" ? `${myRank.accuracy}%` : `${myRank.total_bets}场`}
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => setShowLogin(true)}
            className="w-full bg-white/15 rounded-[12px] py-3 text-center text-[12px] active:scale-[0.98]"
          >
            🔑 登录查看我的排名
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mx-4 mt-4 mb-3">
        <button onClick={() => setTab("accuracy")}
          className={`px-4 py-1.5 rounded-[8px] text-[11px] font-medium transition-colors ${
            tab === "accuracy" ? 'bg-brand-teal text-white' : 'bg-white text-text-tertiary border border-gray-100'
          }`}
        >
          命中率排行
        </button>
        <button onClick={() => setTab("bets")}
          className={`px-4 py-1.5 rounded-[8px] text-[11px] font-medium transition-colors ${
            tab === "bets" ? 'bg-brand-teal text-white' : 'bg-white text-text-tertiary border border-gray-100'
          }`}
        >
          预测场次排行
        </button>
      </div>

      {/* Rank List */}
      {loading ? (
        <div className="px-4 space-y-2.5 mt-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white rounded-[10px] p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-50 rounded animate-pulse" />
              </div>
              <div className="h-5 w-14 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-1.5 pb-6">
          {data.length === 0 && (
            <div className="text-center py-10 text-text-tertiary text-[12px]">
              暂无排行数据，快去参与预测吧！
            </div>
          )}
          {data.map((item) => (
            <div
              key={item.uid}
              className={`bg-white rounded-[10px] p-3.5 shadow-sm border flex items-center gap-3 active:scale-[0.98] transition-transform ${
                item.rank <= 3 ? 'border-amber-200/50' : 'border-gray-100'
              }`}
            >
              {/* Rank Badge */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
                item.rank === 1 ? 'bg-amber-100 text-amber-700' :
                item.rank === 2 ? 'bg-gray-100 text-gray-600' :
                item.rank === 3 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-50 text-text-tertiary'
              }`}>
                {item.isCrown ? '👑' : `#${item.rank}`}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-brand-teal/10 flex items-center justify-center text-[16px] shrink-0">
                {item.avatar || '🐙'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">
                  {item.name}
                  {item.uid === user?.uid && (
                    <span className="ml-1 text-[9px] bg-brand-teal/10 text-brand-teal-dark px-1.5 py-0.5 rounded-[4px]">我</span>
                  )}
                </div>
                <div className="text-[10px] text-text-tertiary">
                  {tab === "accuracy" ? item.stats : `参与${item.total_bets}场`}
                </div>
              </div>

              {/* Value */}
              <div className={`text-[15px] font-bold ${
                tab === "accuracy"
                  ? (item.accuracy >= 70 ? 'text-green-600' : item.accuracy >= 50 ? 'text-amber-600' : 'text-text-tertiary')
                  : 'text-brand-teal-dark'
              }`}>
                {tab === "accuracy" ? `${item.accuracy}%` : `${item.total_bets}场`}
              </div>
            </div>
          ))}
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
