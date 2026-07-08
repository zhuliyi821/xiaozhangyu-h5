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
      <section className="mt-4 px-4 animate-pulse">
        <div className="bg-white rounded-[4px] p-4 shadow-sm border border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
          <div className="h-8 bg-gray-200 rounded w-full" />
        </div>
      </section>
    );
  }
  if (!data) return null;

  const h = data.hot_numbers;
  const ai = data.ai_pick;

  return (
    <section className="mt-4 px-4">
      <Link
        href="/lottery"
        className="block bg-white rounded-[4px] p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            <span className="text-sm font-bold">🎯 双色球 · 热号推荐</span>
          </div>
          <span className="text-[10px] text-brand-teal font-medium flex items-center gap-0.5">
            详情 <span className="text-xs">→</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-text-secondary mb-1.5">
          <span className="flex items-center gap-1">
            🔥 <strong className="text-red-500">{h.red_hot.slice(0, 4).join(" ")}</strong>
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1">
            ❄️ <strong className="text-blue-400">{h.red_cold.slice(0, 4).join(" ")}</strong>
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1">
            🎯 <strong className="text-brand-teal">{ai.red.slice(0, 3).join(" ")}…</strong>
          </span>
        </div>

        <div className="bg-gradient-to-r from-brand-teal/5 to-brand-gold/5 rounded-xl px-3 py-2 border border-brand-teal/10">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-secondary">平台对比</span>
            <span>
              <span className="text-brand-teal font-bold">我们</span>
              <span className="text-text-secondary mx-1">vs</span>
              <span className="text-text-secondary">500彩</span>
              <span className="text-text-secondary mx-1">·</span>
              <span className="text-text-secondary">澳客</span>
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
