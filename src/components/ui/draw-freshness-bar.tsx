/**
 * draw-freshness-bar — 开奖新鲜度 & 倒计时横幅
 * 显示在预测/走势图顶部，让用户知道数据状态
 */
"use client";

import { useState, useEffect } from "react";
import { getNextDraw, formatCountdown, DRAW_SCHEDULES } from "@/lib/draw-schedule";
import { RefreshCw } from "lucide-react";

interface Props {
  type: string;
  /** 最新一期期号 */
  lastPeriod?: number;
  /** 最新一期日期 */
  lastDrawDate?: string;
  /** 手动刷新回调 */
  onRefresh?: () => void;
  /** 是否正在加载 */
  loading?: boolean;
}

export default function DrawFreshnessBar({ type, lastPeriod, lastDrawDate, onRefresh, loading }: Props) {
  const [now, setNow] = useState(new Date());
  const schedule = DRAW_SCHEDULES[type];

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  if (!schedule) return null;

  const nextDraw = getNextDraw(type);
  const isStale = lastDrawDate && (now.getTime() - new Date(lastDrawDate).getTime()) > 3 * 86400000;

  // Auto-refresh: 开奖后3分钟自动检查
  useEffect(() => {
    if (!lastDrawDate) return;
    const [drawHour, drawMin] = schedule.drawTime.split(":").map(Number);
    const today = now.getDay();
    const isDrawDay = schedule.drawDays.includes(today);
    const curMin = now.getHours() * 60 + now.getMinutes();
    const drawMin_ = drawHour * 60 + drawMin;
    if (isDrawDay && curMin >= drawMin_ + 3 && curMin <= drawMin_ + 5) {
      onRefresh?.();
    }
  }, [now.getHours(), now.getMinutes()]);

  return (
    <div className={`mx-4 rounded-[4px] p-3 flex items-center gap-3 text-xs ${
      isStale ? "bg-red-50 text-red-600 border border-red-200" :
      nextDraw.isDrawDay ? "bg-amber-50 text-amber-700 border border-amber-200" :
      "bg-brand-teal/10 text-brand-teal-dark border border-brand-teal/20"
    }`}>
      {/* Status icon */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        isStale ? "bg-red-500 animate-pulse" : "bg-green-500"
      }`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold">
          {schedule.name}
          {lastPeriod ? ` · 第${lastPeriod}期` : ""}
          {lastDrawDate ? ` · ${lastDrawDate.slice(5)}` : ""}
        </div>
        <div className="opacity-75">
          下次开奖: {nextDraw.nextPeriodLabel}
          {" · "}
          倒计时 {formatCountdown(nextDraw.hoursUntilDraw, nextDraw.minutesUntilDraw)}
        </div>
      </div>

      {/* Refresh button */}
      <button onClick={onRefresh} disabled={loading}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] bg-white/60 hover:bg-white text-text-secondary disabled:opacity-50 transition-colors">
        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        <span className="text-[10px]">{loading ? "刷新中" : "刷新"}</span>
      </button>
    </div>
  );
}
