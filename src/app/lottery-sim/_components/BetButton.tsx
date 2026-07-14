"use client";

const MIN_BET = 100;

interface BetButtonProps {
  countdown: number;
  betting: boolean;
  canBet: boolean;
  user: any;
  tickets: any[];
  totalCost: number;
  config: any;
  betMultiple: number;
  showDraw: boolean;
  setShowDraw: (v: boolean) => void;
  setBetting: (v: boolean) => void;
  bettingLockRef: React.MutableRefObject<boolean>;
  setCountdown: (v: number) => void;
  placeBet: () => void;
}

export default function BetButton({
  countdown, betting, canBet, user, tickets, totalCost,
  config, betMultiple, showDraw, setShowDraw,
  setBetting, bettingLockRef, setCountdown, placeBet,
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
      <button onClick={placeBet} disabled={betting || !canBet}
        className={`w-full py-3 mb-2 rounded-[8px] text-sm font-bold text-white active:scale-[0.97] transition-all ${
          canBet ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark shadow-sm" : "bg-bg text-text-tertiary border border-border-tertiary"
        }`}>
        {countdown > 0
          ? `🎰 开奖倒计时 ${countdown}秒`
          : betting
            ? "开奖中..."
            : !user
              ? "请先登录"
              : `参与 ${cost} 🎮`}
      </button>

      {countdown > 0 && !showDraw && (
        <button onClick={() => { setShowDraw(true); setBetting(false); bettingLockRef.current = false; setCountdown(0); }}
          className="w-full -mt-1 mb-2 py-1.5 text-[11px] rounded-[6px] active:scale-95 transition-all bg-brand-coral-light/40 text-brand-coral-dark font-medium">
          跳过 · 立即查看 →
        </button>
      )}

      {!countdown && !betting && (
        <div className="text-[10px] text-center -mt-1 mb-3"
          style={{color: belowMin ? "var(--color-brand-coral)" : "var(--color-text-tertiary)"}}>
          最低参与 {MIN_BET}🎮 · 当前 {cost}🎮
          {belowMin && (
            <span className="font-semibold ml-1" style={{color: "var(--color-brand-coral)"}}>⚠ 未达最低限额，请增加注数</span>
          )}
        </div>
      )}
    </div>
  );
}
