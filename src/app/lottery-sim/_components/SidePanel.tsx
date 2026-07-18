"use client";

import { useState } from "react";
import { X, BarChart3, CalendarCheck, History, ChevronDown } from "lucide-react";
import { C } from "@/lib/brand-colors";
import DailyChallenges from "./DailyChallenges";
import BetHistory from "./BetHistory";

interface PlayerStats {
  totalBets: number; totalWins: number; totalProfit: number;
  biggestWin: number; bestStreak: number; worstStreak: number; currentStreak: number;
}

interface DailyTask {
  date: string; checkedIn: boolean; betCount: number;
  hotWin: boolean; earn50: boolean; streak3: number;
  claimed: string[]; streakDay: number; chestStars: number; chestOpened: boolean;
}

interface Achievement {
  first_bet?: boolean; bet_100?: boolean; bet_1000?: boolean;
  jackpot?: boolean; night_owl?: boolean; streak_5?: boolean;
}

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  // Stats
  playerStats: PlayerStats;
  // Daily
  user: any;
  dailyTasks: DailyTask;
  onSetDailyTasks: (t: any) => void;
  achievements: Record<string, boolean>;
  onSetAchievements: (v: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  balance: number;
  onSetBalance: (v: number | ((prev: number) => number)) => void;
  apiBase: string;
  // History
  history: any[];
  onHistoryView: () => void;
  // Lottery
  lotteryCode?: string;
}

type TabId = "stats" | "daily" | "history";

export default function SidePanel({
  open, onClose,
  playerStats,
  user, dailyTasks, onSetDailyTasks, achievements, onSetAchievements,
  balance, onSetBalance, apiBase,
  history, onHistoryView,
  lotteryCode,
}: SidePanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("stats");

  if (!open) return null;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "stats", label: "统计", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: "daily", label: "每日", icon: <CalendarCheck className="w-3.5 h-3.5" /> },
    { id: "history", label: "历史", icon: <History className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[800] bg-black/40" onClick={onClose} />
      <div className="fixed top-0 right-0 z-[810] w-[300px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-[13px] font-semibold">工具箱</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-all"
              style={{
                color: activeTab === tab.id ? C.coral : "#888780",
                borderBottom: activeTab === tab.id ? `2px solid ${C.coral}` : "2px solid transparent",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-3 space-y-3">
          {/* ── Tab: Stats ── */}
          {activeTab === "stats" && (
            <>
              {/* Quick links */}
              <div className="bg-gray-50 rounded-[8px] p-3">
                <a href={"/lottery?type=" + lotteryCode} className="text-[11px] font-semibold" style={{color: C.teal}}>📊 冷热号分析 →</a>
                <p className="text-[9px] text-text-tertiary mt-1">查看各号码出现频率和冷热状态</p>
              </div>

              {/* Player stats */}
              <div className="bg-gray-50 rounded-[8px] p-3">
                <div className="text-[11px] font-semibold mb-2" style={{color: "#1C1C1E"}}>📈 参与统计</div>
                {playerStats.totalBets === 0 ? (
                  <div className="text-[10px] text-text-tertiary text-center py-3">还没参与，开始玩吧！</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      <StatCard label="总局数" value={`${playerStats.totalBets}`} />
                      <StatCard label="胜率" value={`${playerStats.totalBets > 0 ? Math.round(playerStats.totalWins / playerStats.totalBets * 100) : 0}%`} accent={playerStats.totalWins / Math.max(playerStats.totalBets, 1) >= 0.5} />
                      <StatCard label="总盈亏" value={`${playerStats.totalProfit >= 0 ? "+" : ""}${playerStats.totalProfit.toLocaleString()}`} accent={playerStats.totalProfit > 0} />
                      <StatCard label="最大奖金" value={playerStats.biggestWin.toLocaleString()} />
                    </div>
                    {/* Streak bar */}
                    <div className="flex items-center justify-between text-[10px] text-text-tertiary mt-1 pt-2 border-t border-gray-200/60">
                      <span>🔥 {playerStats.bestStreak}连胜</span>
                      <span>❄️ {playerStats.worstStreak}连败</span>
                      <span>📊 {playerStats.currentStreak > 0 ? `+${playerStats.currentStreak}连胜` : playerStats.currentStreak < 0 ? `${playerStats.currentStreak}连败` : "持平"}</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── Tab: Daily ── */}
          {activeTab === "daily" && (
            user ? (
              <DailyChallenges
                user={user}
                dailyTasks={dailyTasks as any}
                onSetDailyTasks={onSetDailyTasks}
                achievements={achievements}
                onSetAchievements={onSetAchievements}
                balance={balance}
                onSetBalance={onSetBalance}
                showTasks={true}
                onSetShowTasks={() => {}}
                apiBase={apiBase}
              />
            ) : (
              <div className="text-[11px] text-text-tertiary text-center py-6">登录后查看每日挑战</div>
            )
          )}

          {/* ── Tab: History ── */}
          {activeTab === "history" && (
            <BetHistory
              history={history}
              onHistoryView={onHistoryView}
            />
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-2 rounded-[6px] bg-white border border-gray-100">
      <div className="text-[8px] text-text-tertiary">{label}</div>
      <div className="text-[12px] font-bold mt-0.5" style={{color: accent ? C.coral : "#1C1C1E"}}>{value}</div>
    </div>
  );
}
