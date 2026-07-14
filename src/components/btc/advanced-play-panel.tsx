"use client";

import { type BetType } from "./use-btc-betting";

interface AdvancedPlayPanelProps {
  betType: BetType;
  bsDirection: string;
  oeDirection: string;
  tailNumber: number | null;
  onSelectType: (type: BetType) => void;
  onSelectBs: (dir: "大" | "小") => void;
  onSelectOe: (dir: "单" | "双") => void;
  onSelectTail: (n: number) => void;
}

export function AdvancedPlayPanel({
  betType, bsDirection, oeDirection, tailNumber,
  onSelectType, onSelectBs, onSelectOe, onSelectTail,
}: AdvancedPlayPanelProps) {
  return (
    <div className="border-t border-border">
      <div className="px-4 pt-3 pb-4 space-y-3">
        <div className="text-[10px] text-text-tertiary font-medium mb-1">🔥 高级玩法</div>

        {/* Game type tabs */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { k: "big" as const, l: "🔴 大小", odds: "1.8" },
            { k: "odd" as const, l: "🔵 单双", odds: "1.8" },
            { k: "tail" as const, l: "🎯 尾号", odds: "8.5" },
          ].map(g => (
            <button key={g.k} onClick={() => onSelectType(g.k)}
              className={`rounded-[8px] py-2 text-center active:scale-95 transition-all ${
                betType === g.k ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white shadow-sm" : "bg-bg text-text-secondary border border-border"
              }`}>
              <div className="text-[14px]">{g.l.split(" ")[0]}</div>
              <div className="text-[9px] font-medium">{g.l.split(" ")[1]} · 赔率{g.odds}</div>
            </button>
          ))}
        </div>

        {betType === "big" && (
          <div className="flex gap-2">
            <button onClick={() => onSelectBs("大")}
              className={`flex-1 rounded-[8px] py-2.5 text-xs font-semibold transition ${bsDirection === "大" ? "bg-red-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border"}`}>🔴 大 (5-9)</button>
            <button onClick={() => onSelectBs("小")}
              className={`flex-1 rounded-[8px] py-2.5 text-xs font-semibold transition ${bsDirection === "小" ? "bg-green-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border"}`}>🟢 小 (0-4)</button>
          </div>
        )}
        {betType === "odd" && (
          <div className="flex gap-2">
            <button onClick={() => onSelectOe("单")}
              className={`flex-1 rounded-[8px] py-2.5 text-xs font-semibold transition ${oeDirection === "单" ? "bg-red-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border"}`}>🔵 单 (1,3,5,7,9)</button>
            <button onClick={() => onSelectOe("双")}
              className={`flex-1 rounded-[8px] py-2.5 text-xs font-semibold transition ${oeDirection === "双" ? "bg-green-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border"}`}>🟢 双 (0,2,4,6,8)</button>
          </div>
        )}
        {betType === "tail" && (
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i).map(n => (
              <button key={n} onClick={() => onSelectTail(n)}
                className={`w-full aspect-square rounded-[8px] text-sm font-bold flex items-center justify-center active:scale-90 transition-all ${
                  tailNumber === n ? "bg-gradient-to-br from-brand-gold to-brand-gold-dark text-white shadow-sm" : "bg-bg text-text-secondary border border-border"
                }`}>{n}</button>
            ))}
          </div>
        )}
        <div className="text-[9px] text-text-tertiary text-center">
          {betType === "big" ? "以BTC价格尾号数字判定 · 大(5-9) 小(0-4)" :
           betType === "odd" ? "以BTC价格尾号数字判定 · 单(1,3,5,7,9) 双(0,2,4,6,8)" :
           "以BTC价格尾号数字判定 · 赔率8.5倍"}
        </div>
      </div>
    </div>
  );
}
