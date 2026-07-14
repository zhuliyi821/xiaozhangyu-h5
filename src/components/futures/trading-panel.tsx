"use client";

import { TrendingUp, RefreshCw, ChevronDown, ChevronUp, Coins } from "lucide-react";

interface TradingPanelProps {
  user: any;
  direction: "long" | "short";
  lots: number;
  leverage: number;
  marginNeeded: number;
  realBalance: number;
  usedMargin: number;
  availableCapital: number;
  price: number;
  operating: boolean;
  isLoggedIn: boolean;
  contract: string;
  multiplier: number;
  contractName: string;
  onDirectionChange: (d: "long" | "short") => void;
  onLotsChange: (n: number) => void;
  onLeverageChange: (n: number) => void;
  onOpen: () => void;
  onRefreshBalance: () => void;
}

export function TradingPanel({
  user, direction, lots, leverage, marginNeeded,
  realBalance, usedMargin, availableCapital,
  price, operating, isLoggedIn,
  contract, multiplier,
  onDirectionChange, onLotsChange, onLeverageChange,
  onOpen, onRefreshBalance,
}: TradingPanelProps) {
  const marginPct = Math.round(100 / leverage);

  return (
    <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-text-tertiary" />
        <span className="text-sm font-semibold">模拟交易</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-[10px] text-right">
            {isLoggedIn ? (
              <>
                <div className="text-text-tertiary">
                  余额: <span className="font-bold text-brand-teal-dark">{realBalance.toLocaleString()}🎮</span>
                </div>
                {usedMargin > 0 && (
                  <div className="text-text-tertiary">
                    冻结: <span className="font-bold text-amber-500">{usedMargin.toLocaleString()}🎮</span>
                    · 可用: <span className="font-bold">{availableCapital.toLocaleString()}</span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-text-tertiary">请先登录</span>
            )}
          </div>
          <button onClick={onRefreshBalance} className="text-text-tertiary hover:text-brand-teal transition-colors" title="刷新余额">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 方向 */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => onDirectionChange("long")}
          className={`flex-1 py-3 rounded-[8px] text-sm font-bold transition-all ${
            direction === "long" ? "bg-brand-coral text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
          }`}>
          📈 做多
        </button>
        <button onClick={() => onDirectionChange("short")}
          className={`flex-1 py-3 rounded-[8px] text-sm font-bold transition-all ${
            direction === "short" ? "bg-brand-teal text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
          }`}>
          📉 做空
        </button>
      </div>

      {/* 杠杆 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-secondary">杠杆</span>
        <div className="flex gap-1.5">
          {[1, 2, 5, 10, 20].map(n => (
            <button key={n} onClick={() => onLeverageChange(n)}
              className={`px-3 py-1 rounded-[6px] text-[11px] font-bold transition-all ${
                leverage === n ? "bg-amber-500/10 text-amber-600 border border-amber-300" : "bg-bg text-text-secondary border border-border-tertiary"
              }`}>{n}x</button>
          ))}
        </div>
      </div>

      {/* 手数 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-secondary">手数</span>
        <div className="flex gap-2">
          {[1, 2, 3, 5, 10].map(n => (
            <button key={n} onClick={() => onLotsChange(n)}
              className={`w-9 h-8 rounded-[6px] text-xs font-bold transition-all ${
                lots === n ? "bg-brand-teal/10 text-brand-teal-dark border border-brand-teal/30" : "bg-bg text-text-secondary border border-border-tertiary"
              }`}>{n}</button>
          ))}
        </div>
      </div>

      {/* 保证金 */}
      <div className="bg-bg rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-tertiary">所需保证金</span>
          <span className="font-bold text-brand-teal-dark">{marginNeeded.toLocaleString()} 🎮</span>
        </div>
        <div className="text-[10px] text-text-tertiary mt-1">
          {contract}×{multiplier}×{price.toFixed(0)}÷{leverage}x×{lots}手 = {marginNeeded.toLocaleString()}🎮
        </div>
      </div>

      {/* CTA */}
      <button onClick={onOpen} disabled={price <= 0 || operating || !user}
        className="w-full py-3 rounded-[8px] text-sm font-bold text-white bg-gradient-to-r from-brand-teal to-brand-teal-dark disabled:opacity-40 active:scale-[0.97] transition-all">
        {!user ? "请先登录" : operating ? "交易中..." :
          `📈 ${direction === "long" ? "开仓做多" : "开仓做空"} · ${lots}手 · ${leverage}x`}
      </button>
    </div>
  );
}
