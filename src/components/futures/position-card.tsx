"use client";

import type { Position } from "./use-futures-positions";

interface PositionCardProps {
  pos: Position;
  operating: boolean;
  onClose: (pos: Position) => void;
}

export function PositionCard({ pos, operating, onClose }: PositionCardProps) {
  return (
    <div className="bg-bg rounded-xl p-3 mb-2 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${pos.direction === "long" ? "bg-brand-coral/10 text-brand-coral" : "bg-brand-teal/10 text-brand-teal"}`}>
            {pos.direction === "long" ? "📈 多" : "📉 空"}
          </span>
          <span className="text-xs font-semibold">{pos.indexName} {pos.lots}手</span>
          <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{pos.leverage}x</span>
        </div>
        <div className={`text-xs font-bold ${pos.pnl >= 0 ? "text-brand-coral" : "text-brand-teal"}`}>
          {pos.pnl >= 0 ? "+" : ""}{pos.pnl.toLocaleString()} ({pos.pnlPct >= 0 ? "+" : ""}{pos.pnlPct}%)
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-text-tertiary mb-2">
        <span>开仓价: {pos.openPrice.toFixed(2)}</span>
        <span>当前价: {pos.currentPrice.toFixed(2)}</span>
        <span>保证金: {pos.margin.toLocaleString()}🎮</span>
      </div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-2 text-[9px]">
          <span className={`font-medium ${pos.pnl >= 0 ? "text-brand-coral" : "text-brand-teal"}`}>
            赚=返还保证金 + ⛏️水晶石盈利
          </span>
        </div>
      </div>
      <button onClick={() => onClose(pos)} disabled={operating}
        className="w-full py-2 rounded-[6px] text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 disabled:opacity-40 active:scale-[0.97] transition-all">
        {operating ? "结算中..." : "平仓"}
      </button>
    </div>
  );
}
