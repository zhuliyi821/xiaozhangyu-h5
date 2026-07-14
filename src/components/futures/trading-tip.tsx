"use client";

import { Info } from "lucide-react";

interface TradingTipProps {
  visible: boolean;
  contract: string;
  multiplier: number;
  leverage: number;
  marginPct: number;
  marginNeeded: number;
  contractName: string;
  onDismiss: () => void;
}

export function TradingTip({ visible, contract, multiplier, leverage, marginPct, marginNeeded, contractName, onDismiss }: TradingTipProps) {
  if (!visible) return null;

  return (
    <div className="bg-brand-gold/5 rounded-[8px] p-3 border border-brand-gold/20">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
        <div className="text-[11px] text-text-secondary leading-relaxed">
          <p className="font-semibold text-brand-gold-dark mb-1">💡 期货小课堂</p>
          <p>• {contractName}合约乘数 <b>{multiplier}元/点</b>，每波动1点=±{multiplier}元</p>
          <p>• 当前杠杆 <b>{leverage}x</b>（保证金比例 <b>{marginPct}%</b>），1手需 ≈{marginNeeded.toLocaleString()}🎮</p>
          <p>• <b>100%真实扣豆交易</b>——开仓冻结保证金🎮，平仓返还+盈利结算⛏️水晶石</p>
          <p>• 做多涨赚跌赔 · 做空跌赚涨赔 · <b>杠杆放大盈亏风险！</b></p>
          <p>• 盈利部分计入<b>水晶石(credit5)</b>，平台真实资产累积</p>
        </div>
        <button onClick={onDismiss} className="text-text-tertiary hover:text-text-primary flex-shrink-0">✕</button>
      </div>
    </div>
  );
}
