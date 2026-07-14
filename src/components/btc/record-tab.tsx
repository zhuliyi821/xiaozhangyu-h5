"use client";

import { type BetRecord } from "./use-btc-records";

interface RecordTabProps {
  records: BetRecord[];
  onRefresh: () => void;
}

export function RecordTab({ records, onRefresh }: RecordTabProps) {
  return (
    <div className="bg-surface rounded-[14px] border border-border shadow-card overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-2">
        <span className="text-[11px] font-semibold text-text-primary">参与记录 ({records.length})</span>
        <button onClick={onRefresh} className="text-[10px] text-brand-teal-dark active:scale-90">🔄 刷新</button>
      </div>
      {records.length === 0 ? (
        <div className="py-8 text-center">
          <div className="text-3xl opacity-40 mb-1">🎲</div>
          <p className="text-[11px] text-text-tertiary">暂无参与记录</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {records.map(b => (
            <div key={b.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-text-tertiary">
                  {b.bet_type === "risefall" ? (b.choice === "涨" ? "📈涨" : "📉跌") :
                   b.bet_type === "bigsmall" ? (b.choice === "大" ? "🔴大" : "🟢小") :
                   b.bet_type === "oddeven" ? (b.choice === "单" ? "🔵单" : "🟢双") :
                   `🎯尾号${b.choice}`}
                  · {b.points}🎮
                </span>
                <span className={`text-[10px] font-semibold ${
                  b.is_win === 1 ? "text-brand-gold-dark" : b.is_win === 0 ? "text-text-tertiary" : "text-brand-teal-dark"
                }`}>
                  {b.is_win === 1 ? `🎉 +${b.settle_points}⛏️` : b.is_win === 0 ? "❌ 已消耗" : "⏳ 待开奖"}
                </span>
              </div>
              <div className="text-[9px] text-text-tertiary">{b.round_no ? `第${b.round_no}期` : ""} · {b.created_at || ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
