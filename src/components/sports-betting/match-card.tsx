"use client";

import { Clock, Users, Coins, TrendingUp, Zap } from "lucide-react";
import { Match } from "@/app/sports-betting/types";
import Link from "next/link";

interface MatchCardProps {
  match: Match;
  isExpanded: boolean;
  hasBet: boolean;
  betSummary: string;
  hotPicks?: { label: string; playType: string; option: string }[];
  onToggle: () => void;
  onQuickBet?: (playType: string, option: string, amount: number) => void;
}

export function MatchCard({ match, isExpanded, hasBet, betSummary, hotPicks, onToggle, onQuickBet }: MatchCardProps) {
  const statusLabel = (() => {
    switch (match.status) {
      case "upcoming": return { label: "⏳ 即将开始", color: "text-text-tertiary" };
      case "open":     return { label: "✅ 参与中", color: "text-brand-teal-dark" };
      case "live":     return { label: "🔴 进行中", color: "text-brand-coral" };
      case "finished": return { label: "🏁 已结束", color: "text-text-secondary" };
      case "settled":  return { label: "💰 已结算", color: "text-text-tertiary" };
    }
  })();

  return (
    <div className="bg-surface rounded-[12px] shadow-sm border border-border-tertiary overflow-hidden">
      <button onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full p-4 text-left active:scale-[0.99] transition-transform">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-bg px-2 py-0.5 rounded text-text-tertiary">{match.league}</span>
            <span className="text-[9px] text-text-tertiary">{match.round}</span>
            {hasBet && (
              <span className="text-[9px] bg-brand-teal/10 text-brand-teal-dark px-1.5 py-[1px] rounded-full font-medium border border-brand-teal/20">
                ✅ 已参与
              </span>
            )}
          </div>
          <span className={`text-[10px] font-medium ${statusLabel.color}`}>{statusLabel.label}</span>
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="flex-1 text-right">
            <div className="text-[14px] font-bold text-text-primary">{match.homeTeam}</div>
          </div>
          <div className="px-3 text-center">
            {match.status === "finished" || match.status === "settled" ? (
              <div className="text-[18px] font-bold text-text-primary">
                {match.homeScore} - {match.awayScore}
              </div>
            ) : (
              <div className="text-[11px] text-text-tertiary">VS</div>
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="text-[14px] font-bold text-text-primary">{match.awayTeam}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-[10px] text-text-tertiary">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {match.matchTime}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" aria-hidden="true" />
            {match.participants}人
          </span>
          <span className="flex items-center gap-1">
            <Coins className="w-3 h-3" aria-hidden="true" />
            {match.totalPool.toLocaleString()}⛏️
          </span>
          {hasBet && (
            <span className="text-[9px] text-brand-teal-dark font-medium">{betSummary}</span>
          )}
        </div>

        {/* 🔥 热门推荐（仅展开态显示） */}
        {!isExpanded && match.status === "open" && hotPicks && hotPicks.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border-tertiary/50">
            <TrendingUp className="w-3 h-3 text-brand-coral flex-shrink-0" aria-hidden="true" />
            <span className="text-[8px] text-text-tertiary flex-shrink-0">热门</span>
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {hotPicks.map((pick, i) => (
                <button key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickBet?.(pick.playType, pick.option, 100);
                  }}
                  className="text-[9px] bg-brand-coral/5 text-brand-coral-dark px-2 py-0.5 rounded-full border border-brand-coral/15 whitespace-nowrap active:scale-95 transition-transform font-medium">
                  {pick.label}
                </button>
              ))}
            </div>
            <Zap className="w-3 h-3 text-brand-gold flex-shrink-0" aria-hidden="true" />
            <span className="text-[7px] text-brand-gold-dark flex-shrink-0">100🎮</span>
          </div>
        )}
      </button>

      {/* 展开内容（由父组件渲染） */}
    </div>
  );
}
