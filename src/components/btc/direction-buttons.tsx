"use client";

interface DirectionButtonsProps {
  betType: string;
  fastDirection: string;
  onSelectDirection: (dir: "涨" | "跌") => void;
}

export function DirectionButtons({ betType, fastDirection, onSelectDirection }: DirectionButtonsProps) {
  const isRiseFall = betType === "risefall";
  return (
    <div className="grid grid-cols-2 gap-0">
      <button onClick={() => { onSelectDirection("涨"); }}
        className={`py-6 flex flex-col items-center justify-center transition-all active:scale-[0.97] ${
          isRiseFall && fastDirection === "涨"
            ? "bg-gradient-to-b from-brand-coral to-brand-coral-dark text-white"
            : "bg-bg text-text-secondary border-r border-b border-border"
        }`}>
        <span className="text-3xl mb-1">📈</span>
        <span className="text-sm font-bold">看涨</span>
        <span className="text-[9px] opacity-70 mt-0.5">赔率 1.8x</span>
      </button>
      <button onClick={() => { onSelectDirection("跌"); }}
        className={`py-6 flex flex-col items-center justify-center transition-all active:scale-[0.97] ${
          isRiseFall && fastDirection === "跌"
            ? "bg-gradient-to-b from-brand-teal to-brand-teal-dark text-white"
            : "bg-bg text-text-secondary border-b border-border"
        }`}>
        <span className="text-3xl mb-1">📉</span>
        <span className="text-sm font-bold">看跌</span>
        <span className="text-[9px] opacity-70 mt-0.5">赔率 1.8x</span>
      </button>
    </div>
  );
}
