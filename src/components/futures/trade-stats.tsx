"use client";

import { Target, ChevronDown, ChevronUp, Coins } from "lucide-react";
import type { TradeRecord } from "./use-futures-positions";

interface TradeStatsProps {
  realizedPnl: number;
  floatingPnl: number;
  usedMargin: number;
  realBalance: number;
  trades: TradeRecord[];
  onReset: () => void;
}

export function TradeStats({ realizedPnl, floatingPnl, usedMargin, realBalance, trades, onReset }: TradeStatsProps) {
  return (
    <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm font-semibold">模拟战绩</span>
        </div>
        <button onClick={() => {
            if (usedMargin > 0 && !confirm("当前有持仓未平仓，重置后持仓记录将丢失但已冻结的游戏豆不会自动返还，建议先平仓。确定重置？")) return;
            onReset();
          }}
          className="text-[10px] px-3 py-1 rounded text-text-tertiary border border-border-tertiary hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
          🔄 重置
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-bg rounded-xl p-2 text-center">
          <div className="text-[9px] text-text-tertiary">已实现盈亏</div>
          <div className={`text-sm font-bold ${realizedPnl >= 0 ? "text-brand-coral" : "text-brand-teal"}`}>
            {(realizedPnl >= 0 ? "+" : "") + realizedPnl.toLocaleString()}
          </div>
        </div>
        <div className="bg-bg rounded-xl p-2 text-center">
          <div className="text-[9px] text-text-tertiary">持仓浮盈</div>
          <div className={`text-sm font-bold ${floatingPnl >= 0 ? "text-brand-coral" : "text-brand-teal"}`}>
            {(floatingPnl >= 0 ? "+" : "") + floatingPnl.toLocaleString()}
          </div>
        </div>
        <div className="bg-bg rounded-xl p-2 text-center">
          <div className="text-[9px] text-text-tertiary">冻结保证金</div>
          <div className="text-sm font-bold text-amber-500">{usedMargin.toLocaleString()}</div>
        </div>
      </div>

      {/* 真实资产状态 */}
      <div className="bg-bg/50 rounded-xl p-2.5 mb-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-text-tertiary flex items-center gap-1">
            <Coins className="w-3 h-3" /> 真实资产
          </span>
          <span className="font-bold text-brand-teal-dark">{realBalance.toLocaleString()}🎮</span>
        </div>
        {usedMargin > 0 && (
          <div className="flex items-center justify-between text-[10px] mt-1">
            <span className="text-text-tertiary">冻结中（平仓后返还）</span>
            <span className="font-bold text-amber-500">{usedMargin.toLocaleString()}🎮</span>
          </div>
        )}
      </div>

      {/* 交易记录 */}
      {trades.length > 0 ? (
        <details>
          <summary className="flex items-center justify-between text-xs text-text-secondary cursor-pointer py-1">
            <span>交易记录 ({trades.length}笔)</span>
            <ChevronDown className="w-3 h-3" />
          </summary>
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {trades.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] py-1 border-b border-border-tertiary/30">
                <span className="text-text-tertiary w-14">{t.time}</span>
                <span className="font-medium w-16">{t.action}</span>
                <span className="text-text-secondary w-16">{t.indexName}</span>
                <span className="font-bold w-10">{t.lots}手</span>
                <span className={`font-bold w-16 text-right ${t.pnl > 0 ? "text-brand-coral" : t.pnl < 0 ? "text-brand-teal" : "text-text-tertiary"}`}>
                  {t.pnl > 0 ? "+" : ""}{t.pnl.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </details>
      ) : (
        <div className="text-center py-4 text-[11px] text-text-tertiary">
          暂无交易记录，点击"开仓"开始模拟交易 👆
        </div>
      )}
    </div>
  );
}
