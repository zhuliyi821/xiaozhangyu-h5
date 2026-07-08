"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface HotCardData {
  lottery_name: string;
  latest_draw: { issue: string; date: string; red: number[]; blue: number };
  hot_numbers: { red_hot: number[]; red_warm: number[]; red_cold: number[] };
  ai_pick: { red: number[]; blue: number };
  platform_comparison: Record<string, number>;
  analysis: string;
  total_draws: number;
}

function NumberBall({ n, type }: { n: number; type: "hot" | "warm" | "cold" | "pick" | "blue" }) {
  const colors: Record<string, string> = {
    hot: "bg-red-500 text-white",
    warm: "bg-amber-400 text-white",
    cold: "bg-blue-400 text-white",
    pick: "bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white",
    blue: "bg-brand-gold text-white",
  };
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${colors[type]} shadow-sm`}>
      {String(n).padStart(2, "0")}
    </span>
  );
}

function PlatformBar({ label, rate, maxRate, ours }: { label: string; rate: number; maxRate: number; ours: boolean }) {
  const pct = maxRate > 0 ? (rate / maxRate) * 80 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-20 shrink-0 ${ours ? "text-brand-teal font-bold" : "text-text-secondary"}`}>{label}</span>
      <div className="flex-1 h-4 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${ours ? "bg-gradient-to-r from-brand-teal to-brand-gold" : "bg-gray-300"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-12 text-right font-medium ${ours ? "text-brand-teal" : "text-text-secondary"}`}>{rate.toFixed(1)}%</span>
    </div>
  );
}

export default function LotteryPage() {
  const [data, setData] = useState<HotCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lottery/hot-card")
      .then(r => r.json())
      .then(d => setData(d?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg pb-20">
        <div className="animate-pulse p-4 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-[4px]" />)}
        </div>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="min-h-screen bg-bg pb-20 flex items-center justify-center">
        <p className="text-text-tertiary text-sm">暂无数据</p>
      </main>
    );
  }

  const h = data.hot_numbers;
  const p = data.platform_comparison;
  const maxRate = Math.max(...Object.values(p), 1);

  return (
    <main className="min-h-screen bg-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border-tertiary">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </Link>
          <div>
            <h1 className="text-base font-bold">🎯 双色球·热号推荐</h1>
            <p className="text-[10px] text-text-tertiary">基于福彩官方{data.total_draws}期开奖数据 · 每日更新</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 最新开奖 */}
        <div className="bg-white rounded-[4px] p-4 shadow-sm border border-gray-100">
          <div className="text-xs font-bold text-text-primary mb-2">📅 最新开奖</div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-text-tertiary">第{data.latest_draw.issue}期</span>
              <span className="text-[10px] text-text-tertiary ml-2">{data.latest_draw.date}</span>
            </div>
            <div className="flex items-center gap-1">
              {data.latest_draw.red.map(n => <NumberBall key={n} n={n} type="pick" />)}
              <NumberBall n={data.latest_draw.blue} type="blue" />
            </div>
          </div>
        </div>

        {/* 冷热温号 */}
        <div className="bg-white rounded-[4px] p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="text-xs font-bold text-text-primary">📊 冷热温号分布</div>
          <div className="flex items-start gap-3">
            <span className="flex items-center gap-1 text-[10px] font-medium text-red-500 shrink-0 mt-1">🔥 热</span>
            <div className="flex gap-1 flex-wrap">{h.red_hot.map(n => <NumberBall key={n} n={n} type="hot" />)}</div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500 shrink-0 mt-1">🟡 温</span>
            <div className="flex gap-1 flex-wrap">{h.red_warm.map(n => <NumberBall key={n} n={n} type="warm" />)}</div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex items-center gap-1 text-[10px] font-medium text-blue-400 shrink-0 mt-1">❄️ 冷</span>
            <div className="flex gap-1 flex-wrap">{h.red_cold.map(n => <NumberBall key={n} n={n} type="cold" />)}</div>
          </div>
        </div>

        {/* AI精选 */}
        <div className="bg-gradient-to-r from-brand-teal/5 to-brand-gold/5 rounded-[4px] p-4 border border-brand-teal/20 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="w-4 h-4 text-brand-teal" />
            <span className="text-xs font-bold text-brand-teal">AI精选推荐</span>
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] text-text-secondary w-6">红球</span>
            <div className="flex gap-1">
              {data.ai_pick.red.map(n => <NumberBall key={n} n={n} type="pick" />)}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-text-secondary w-6">蓝球</span>
            <NumberBall n={data.ai_pick.blue} type="blue" />
          </div>
        </div>

        {/* 平台对比 */}
        <div className="bg-white rounded-[4px] p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
            <TrendingUp className="w-4 h-4" />
            近30期命中率对比 (≥3红)
          </div>
          {Object.entries(p).map(([key, rate]) => {
            const labels: Record<string, string> = {
              platform_500: "500彩(热号优先)",
              platform_aoke: "澳客(冷热搭配)",
              platform_caijing: "彩经(遗漏回补)",
              ours: "👑 我们的",
            };
            return <PlatformBar key={key} label={labels[key] || key} rate={rate} maxRate={maxRate} ours={key === "ours"} />;
          })}
          <div className="text-[9px] text-text-tertiary text-center pt-1">
            基于{data.total_draws}期福彩官方数据 · 回溯验证近30期
          </div>
        </div>

        {/* 免责声明 */}
        <div className="text-[10px] text-text-tertiary text-center leading-relaxed">
          本服务基于福彩官方历史数据，通过统计分析和传统文化推演生成参考信息。
          <br />
          理性购彩，量力而行。不向未成年人出售彩票。
        </div>
      </div>
    </main>
  );
}
