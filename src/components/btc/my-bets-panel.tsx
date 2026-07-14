"use client";

import { type BetRecord } from "./use-btc-records";

interface MyBetsPanelProps {
  records: BetRecord[];
  activeBetIds: number[];
}

export function MyBetsPanel({ records, activeBetIds }: MyBetsPanelProps) {
  if (records.length === 0) return null;

  return (
    <div className="bg-surface rounded-[14px] border border-border shadow-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-text-primary">📋 本轮参与 ({records.length})</span>
        {activeBetIds.length > 0 && (
          <span className="text-[9px] text-brand-gold-dark bg-brand-gold-light/30 px-2 py-0.5 rounded-full">
            {activeBetIds.length}笔待开奖
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {records.slice(0, 5).map(b => (
          <div key={b.id} className="flex items-center justify-between bg-bg rounded-[8px] px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-tertiary">
                {b.bet_type === "risefall" ? (b.choice === "涨" ? "📈涨" : "📉跌") :
                 b.bet_type === "bigsmall" ? (b.choice === "大" ? "🔴大" : "🟢小") :
                 b.bet_type === "oddeven" ? (b.choice === "单" ? "🔵单" : "🟢双") :
                 `🎯尾号${b.choice}`}
              </span>
              <span className="text-[10px] font-medium">{b.points}🎮</span>
            </div>
            <span className={`text-[10px] font-semibold ${
              b.is_win === 1 ? "text-brand-gold-dark" : b.is_win === 0 ? "text-text-tertiary" : "text-brand-teal-dark"
            }`}>
              {b.is_win === 1 ? `🎉 +${b.settle_points}⛏️` : b.is_win === 0 ? "❌" : "⏳ 待开奖"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
