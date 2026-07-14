"use client";

interface PricePanelProps {
  price: number;
  changePct: number;
  countdown: number;
  poolData: { instant_pool: number; cumulative_pool: number } | null;
  priceFlash: "up" | "down" | null;
}

export function PricePanel({ price, changePct, countdown, poolData, priceFlash }: PricePanelProps) {
  const barPercent = countdown > 0 ? (countdown / 60) * 100 : 0;
  const barColor = countdown > 20
    ? "linear-gradient(90deg, #45CCD5, #2BAAAF)"
    : countdown > 5
      ? "linear-gradient(90deg, #F2B631, #F27152)"
      : "#E5E7EB";

  return (
    <div className="bg-surface rounded-[14px] border border-border shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-text-tertiary font-medium">实时价格</span>
        </div>
        <span className="text-[10px] text-text-tertiary">
          ⚡ 奖池 {poolData ? (poolData.instant_pool || 0).toLocaleString() : "—"}⛏️
        </span>
      </div>
      <div className={`text-2xl font-bold tracking-tight mb-2 transition-colors duration-500 ${
        priceFlash === "up" ? "text-green-500" : priceFlash === "down" ? "text-red-500" : "text-text-primary"
      }`}>${price ? price.toLocaleString() : "—"}</div>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[11px] font-semibold ${changePct > 0 ? "text-red-500" : changePct < 0 ? "text-green-500" : "text-text-tertiary"}`}>
          {changePct >= 0 ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}% (24h)
        </span>
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-tertiary">⏱ 本轮</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            countdown > 0 ? "bg-brand-teal-light/30 text-brand-teal-dark" : "bg-gray-50 text-text-tertiary"
          }`}>{countdown > 0 ? "进行中" : "等待中"}</span>
        </div>
        <span className={`text-base font-bold ${
          countdown > 20 ? "text-brand-teal-dark" : countdown > 5 ? "text-brand-gold-dark" : countdown > 0 ? "text-brand-coral-dark" : "text-text-tertiary"
        }`}>
          {countdown > 0 ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}` : "—"}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${barPercent}%`, background: barColor }} />
      </div>
    </div>
  );
}
