"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日 周${["日","一","二","三","四","五","六"][d.getDay()]}`;
}

interface AiPredictionsHeaderProps {
  isToday: boolean;
  data: { latest_date: string; report: { summary: string } };
  refreshing: boolean;
  onRefresh: () => void;
  recentWinMsg: string | null;
}

export default function AiPredictionsHeader({ isToday, data, refreshing, onRefresh, recentWinMsg }: AiPredictionsHeaderProps) {
  return (
    <>
      {/* 品牌Header */}
      <div className="bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-teal-darkest text-white px-5 pt-4 pb-5 rounded-b-[28px] shadow-soft">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[6px] bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="font-bold text-[9px]">AI</span>
            </div>
            <div>
              <span className="text-[15px] font-bold">AI 预测</span>
              {isToday && <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-medium ml-1.5">今日</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/jiadouzhan" className="text-[10px] bg-white/15 backdrop-blur px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              获取游戏豆 →
            </Link>
            <button onClick={onRefresh} disabled={refreshing}
              className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform">
              <RefreshCw size={13} className={`${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] opacity-80">{formatDate(data.latest_date)}</span>
          {data.report.summary && (
            <span className="text-[10px] opacity-60 truncate max-w-[180px] ml-2">{data.report.summary}</span>
          )}
        </div>
      </div>

      {/* 赢奖反馈 */}
      {recentWinMsg && (
        <div className="px-4 -mt-4 relative z-10 mb-2">
          <div className="bg-gradient-to-r from-brand-gold to-brand-gold-dark rounded-[10px] py-2.5 px-4 text-center shadow-sm animate-[celebrate-pop_0.4s_ease-out]">
            <span className="text-[13px] font-semibold text-white">{recentWinMsg}</span>
          </div>
        </div>
      )}
    </>
  );
}
