"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

interface HotCardMiniProps {
  data?: {
    lottery_name: string;
    hot_numbers: { red_hot: number[]; red_cold: number[] };
    ai_pick: { red: number[]; blue: number };
    platform_comparison: Record<string, number>;
  } | null;
  loading?: boolean;
}

export default function LotteryHotCard({ data, loading }: HotCardMiniProps) {
  if (loading) {
    return (
      <div className="animate-pulse mb-5">
        <div className="rounded-[12px] bg-gradient-to-br from-white to-brand-teal-light/[0.08] border border-brand-teal/10 overflow-hidden">
          <div className="p-5">
            <div className="h-4 bg-gray-200/60 rounded w-24 mb-4" />
            <div className="h-px bg-gray-200/40 mb-4" />
            <div className="flex gap-1.5 mb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-[30px] h-[30px] rounded-full bg-gray-200/50" />
              ))}
            </div>
            <div className="h-3 bg-gray-200/30 rounded w-48" />
          </div>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const h = data.hot_numbers;
  const ai = data.ai_pick;

  return (
    <Link
      href="/lottery"
      className="relative block rounded-[12px] bg-gradient-to-br from-white to-brand-teal-light/[0.08] border border-brand-teal/10 shadow-soft mb-5 overflow-hidden active:scale-[0.98] transition-transform group"
    >
      {/* 顶部茶色渐变线 */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-teal/60 via-brand-teal to-brand-gold/60" />

      <div className="p-5">

        {/* ── 标题 ── */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            <span className="text-sm font-bold">热号推荐</span>
          </div>
          <span className="text-[10px] text-brand-teal font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            详情 <span className="text-xs">→</span>
          </span>
        </div>

        {/* ── 分割线 ── */}
        <div className="h-px bg-gradient-to-r from-brand-teal/20 via-brand-teal/5 to-transparent mb-4" />

        {/* ── AI精选：主视觉 ── */}
        <div className="mb-3">
          <div className="text-[10px] text-text-tertiary font-medium tracking-wider mb-2.5">AI 精选</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {ai.red.slice(0, 6).map((n: number, i: number) => (
              <span key={i}
                className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white text-[11px] font-bold flex items-center justify-center shadow-soft">
                {String(n).padStart(2, '0')}
              </span>
            ))}
            <span className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-brand-coral to-brand-coral-dark text-white text-[11px] font-bold flex items-center justify-center shadow-soft ml-1">
              {String(ai.blue).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* ── 热度参考（弱化） ── */}
        <div className="text-[10px] text-text-tertiary flex items-center gap-1.5 flex-wrap">
          <span className="font-medium tracking-wider">热度</span>
          {h.red_hot.slice(0, 5).map((n: number, i: number) => (
            <span key={i} className="text-text-secondary">{String(n).padStart(2, '0')}</span>
          ))}
          <span className="text-text-tertiary ml-0.5">·</span>
          <span className="font-medium tracking-wider">蓝</span>
          <span className="text-text-secondary">{String(ai.blue).padStart(2, '0')}</span>
        </div>

      </div>
    </Link>
  );
}
