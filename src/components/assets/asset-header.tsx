"use client";

// ─── 统一资产中心 · 品牌头卡 ───
// 主资产(游戏豆)大数字 + 今日变动 + 3个QuickAction

import { fmtFull, fmtNum } from "./asset-types";

interface Props {
  gameCoins: number;
  dailyChange?: number;
  loading?: boolean;
  onGetCoins: () => void;
  onViewFlow: () => void;
  onViewGoals: () => void;
}

export default function AssetHeader({ gameCoins, dailyChange, loading, onGetCoins, onViewFlow, onViewGoals }: Props) {
  // 今日变动颜色
  const changeColor = (dailyChange ?? 0) >= 0 ? "text-emerald-400" : "text-red-400";
  const changeSign = (dailyChange ?? 0) >= 0 ? "▲" : "▼";

  return (
    <div className="mx-4 mt-2 bg-gradient-to-br from-brand-teal-darkest via-brand-teal to-brand-teal-dark rounded-[16px] p-5 text-white shadow-lg relative overflow-hidden">
      {/* 装饰圆 */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />

      <div className="relative z-10">
        {/* 标题行 */}
        <div className="text-[10px] text-white/60 font-medium tracking-wider uppercase mb-1">总资产</div>

        {/* 游戏豆大数字 */}
        {loading ? (
          <div className="h-9 w-48 bg-white/10 rounded-[8px] animate-pulse mt-1" />
        ) : (
          <div className="text-[30px] font-bold tracking-tight leading-none mt-1">
            🎮 {fmtFull(gameCoins)}
            <span className="text-sm font-medium text-white/70 ml-2">游戏豆</span>
          </div>
        )}

        {/* 今日变动 */}
        {dailyChange !== undefined && (
          <div className={`text-[11px] ${changeColor} mt-1 font-medium`}>
            {changeSign} 今日 {dailyChange >= 0 ? "+" : ""}{fmtFull(Math.abs(dailyChange))}
          </div>
        )}

        {/* 快捷操作 */}
        <div className="flex gap-2 mt-4">
          <button onClick={onGetCoins}
            className="flex-1 py-2 bg-white/20 backdrop-blur-sm rounded-[10px] text-[11px] font-semibold hover:bg-white/30 active:scale-95 transition-all">
            🔋 获取游戏豆
          </button>
          <button onClick={onViewFlow}
            className="flex-1 py-2 bg-white/20 backdrop-blur-sm rounded-[10px] text-[11px] font-semibold hover:bg-white/30 active:scale-95 transition-all">
            📊 流水
          </button>
          <button onClick={onViewGoals}
            className="flex-1 py-2 bg-white/20 backdrop-blur-sm rounded-[10px] text-[11px] font-semibold hover:bg-white/30 active:scale-95 transition-all">
            🎯 目标
          </button>
        </div>
      </div>
    </div>
  );
}
