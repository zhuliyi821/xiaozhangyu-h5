"use client";

import { Users, Coins, TrendingUp, Trophy, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

interface BettingHeaderProps {
  totalPlayers: number;
  totalBets: number;
  ongoingMatches: number;
  balance: number;
  user: any;
  onRefreshBalance: () => void;
}

export function BettingHeader({ totalPlayers, totalBets, ongoingMatches, balance, user, onRefreshBalance }: BettingHeaderProps) {
  const stats = [
    { label: "在线玩家", val: totalPlayers.toLocaleString(), icon: Users },
    { label: "总参与", val: (totalBets / 10000).toFixed(0) + "万", icon: Coins },
    { label: "进行中", val: ongoingMatches + "场", icon: TrendingUp },
  ];

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-teal-darkest text-white px-5 pt-5 pb-6">
        <div className="flex items-center justify-between mb-1">
          <Link href="/" className="text-white/60 text-[11px] hover:text-white transition-colors">&larr; 返回首页</Link>
        </div>
        <div className="mt-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-gold" aria-hidden="true" />
            <h1 className="text-[17px] font-bold">省超足球竞猜</h1>
          </div>
          <p className="text-[11px] text-white/70 mt-1">预测比赛结果 · 赢取水晶石奖励</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {stats.map((d, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-[8px] p-2 text-center" role="group" aria-label={d.label}>
              <d.icon className="w-3.5 h-3.5 mx-auto mb-0.5 opacity-70" aria-hidden="true" />
              <div className="text-[11px] font-bold" aria-label={`${d.label}: ${d.val}`}>{d.val}</div>
              <div className="text-[8px] opacity-60">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 余额 */}
      {user && (
        <div className="mx-4 mt-3">
          <div className="bg-surface rounded-[10px] p-3 flex items-center justify-between shadow-sm border border-border-tertiary">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-brand-teal" aria-hidden="true" />
              <span className="text-xs text-text-tertiary">可用游戏豆</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-brand-teal-dark" aria-live="polite">{balance.toLocaleString()} 🎮</span>
              <button onClick={onRefreshBalance} className="text-text-tertiary hover:text-brand-teal transition-colors p-0.5" aria-label="刷新余额">
                <Coins className="w-3 h-3" />
              </button>
              <Link href="/jiadouzhan"
                className="text-[10px] bg-brand-gold text-white px-2.5 py-1 rounded-[6px] font-medium active:scale-95">
                获取豆
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
