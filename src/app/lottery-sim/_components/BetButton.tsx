"use client";

const MIN_BET = 100;

interface BetButtonProps {
  canBet: boolean;
  user: any;
  tickets: any[];
  totalCost: number;
  config: any;
  betMultiple: number;
  betting: boolean;
  isBetDisabled: boolean;
  placeBet: () => void;
}

export default function BetButton({
  canBet, user, tickets, totalCost,
  config, betMultiple, betting, isBetDisabled, placeBet,
}: BetButtonProps) {
  const cost = tickets.length > 0 ? totalCost : (config?.price || 100) * betMultiple;
  const belowMin = cost < MIN_BET;

  return (
    <div className="px-4">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[10px] text-text-tertiary">投注金额</span>
        <span className="text-xs font-bold" style={{color: belowMin ? "#E24B4A" : "#1C1C1E"}}>
          {cost} 🎮
          {belowMin && <span className="text-[9px] font-normal ml-1" style={{color: "#E24B4A"}}>(未达最低限额)</span>}
        </span>
      </div>
      <button onClick={placeBet} disabled={betting || isBetDisabled || !canBet}
        className={`w-full py-3 mb-2 rounded-[8px] text-sm font-bold text-white active:scale-[0.97] transition-all ${
          canBet ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark shadow-sm" : "bg-bg text-text-tertiary border border-border-tertiary"
        }`}>
        {betting
          ? "开奖中..."
          : !user
            ? "请先登录"
            : `参与 ${cost} 🎮`}
      </button>
      <div className="text-[10px] text-center -mt-1 mb-3"
        style={{color: belowMin ? "var(--color-brand-coral)" : "var(--color-text-tertiary)"}}>
        最低参与 {MIN_BET}🎮 · 当前 {cost}🎮
        {belowMin && (
          <span className="font-semibold ml-1" style={{color: "var(--color-brand-coral)"}}>⚠ 未达最低限额，请增加注数</span>
        )}
      </div>
    </div>
  );
}
