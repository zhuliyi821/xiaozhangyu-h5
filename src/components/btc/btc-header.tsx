"use client";

import { ArrowLeft, Coins } from "lucide-react";

interface BtcHeaderProps {
  price: number;
  symbol: string;
  gameBeans: number;
}

export function BtcHeader({ price, symbol, gameBeans }: BtcHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-brand-gold via-brand-gold-dark to-amber-700 text-white px-4 pt-4 pb-5 rounded-b-[28px] shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} className="active:scale-90">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold tracking-tight">{symbol}</span>
        </div>
        <div className="flex items-center gap-2">
          <Coins size={14} className="opacity-80" />
          <span className="text-[11px] bg-white/15 backdrop-blur px-2.5 py-1 rounded-lg">
            {gameBeans.toLocaleString()} 🎮
          </span>
        </div>
      </div>
      {price > 0 && (
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] opacity-70">实时价格</span>
            <div className="text-xl font-bold tracking-tight">${price.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
