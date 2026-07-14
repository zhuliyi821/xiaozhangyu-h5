"use client";

import { AlertTriangle } from "lucide-react";

interface BetSlipProps {
  tickets: Array<{ front: number[]; back: number[] }>;
  onRemoveTicket: (idx: number) => void;
  totalCost: number;
  betMultiple: number;
  onSetBetMultiple: (v: number | ((prev: number) => number)) => void;
  error: string;
}

export default function BetSlip({ tickets, onRemoveTicket, totalCost, betMultiple, onSetBetMultiple, error }: BetSlipProps) {
  if (tickets.length === 0 && !error) return null;

  return (
    <>
      {/* Bet Slip */}
      {tickets.length > 0 && (
        <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary mb-3">
          <div className="text-sm font-medium mb-2">参与清单 ({tickets.length}注)</div>
          {tickets.map((t, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border-tertiary/40 last:border-0">
              <div className="text-xs">
                <span className="text-red-500 font-medium">{t.front.join(", ")}</span>
                {t.back.length > 0 && <span className="text-blue-500 font-medium ml-1">+ {t.back.join(", ")}</span>}
              </div>
              <button onClick={() => onRemoveTicket(i)} className="text-red-400 text-[10px] px-2 py-0.5 rounded-full border border-red-200 active:scale-90">删除</button>
            </div>
          ))}
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-text-tertiary">共 {tickets.length} 注</div>
            <div className="text-sm font-bold">{totalCost} 🎮</div>
          </div>
        </div>
      )}

      {/* Multiple selector */}
      <div className="bg-surface rounded-[8px] p-3 shadow-sm border border-border-tertiary mb-3 flex items-center justify-between">
        <span className="text-xs text-text-secondary">倍数</span>
        <div className="flex items-center gap-2">
          {[1, 2, 5, 10].map(m => (
            <button key={m} onClick={() => onSetBetMultiple(m)}
              className={`w-8 h-7 rounded-[8px] text-xs font-medium active:scale-90 ${betMultiple === m ? "bg-brand-teal text-white" : "bg-bg text-text-secondary border border-border-tertiary"}`}>
              {m}x
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-600 text-xs mb-3">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </>
  );
}
