"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import Link from "next/link";

interface WuxingLevel {
  level: string; name: string; element: string; hex: string; shades: string[];
}

interface FortuneData {
  score: number; tag: string;
  do: string[]; dont: string[];
  direction: string;
  wuxingLevels: WuxingLevel[];
  wuxingAdvice: string;
  luckyColor: string;
}

const SCORE_TAGS = [
  { min: 85, label: "大吉", color: "text-green-600" },
  { min: 70, label: "吉", color: "text-amber-600" },
  { min: 55, label: "中平", color: "text-amber-600/70" },
  { min: 0,  label: "小凶", color: "text-brand-coral" },
];

function getTag(score: number) {
  return SCORE_TAGS.find(t => score >= t.min) || SCORE_TAGS[3];
}

export function FortuneCard() {
  const { user } = useAuth();
  const [data, setData] = useState<FortuneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFortune = (retryAsGuest = false) => {
    const uid = (user as any)?.uid || 0;
    // 如果用户无出生信息导致API返回400，降级为匿名通用运势
    const actualUid = retryAsGuest ? 0 : uid;
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/api/v1/fortune/today`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: actualUid }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data) {
          const raw = d.data;
          setData({
            score: raw.score,
            tag: getTag(raw.score).label,
            do: raw.advice?.do?.slice(0, 2) || ["好好生活"],
            dont: raw.advice?.dont?.slice(0, 2) || ["冲动决策"],
            direction: raw.lucky?.direction || "正南",
            wuxingLevels: raw.wuxing_dress?.levels?.slice(0, 3) || [],
            wuxingAdvice: raw.wuxing_dress?.advice || "",
            luckyColor: raw.lucky?.color || "",
          });
        } else if (!retryAsGuest && uid > 0) {
          // 用户无出生信息 → 降级为匿名通用运势
          fetchFortune(true);
        } else {
          setError("暂无数据");
        }
      })
      .catch(() => !retryAsGuest && uid > 0 ? fetchFortune(true) : setError("加载失败"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFortune(); }, [user]);

  // 骨架屏
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-brand-teal/10 shadow-sm overflow-hidden animate-pulse">
        <div className="px-4 pt-3 pb-3.5">
          <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
          <div className="flex gap-2 mb-2">
            <div className="flex-1 h-16 bg-gray-100 rounded-[8px]" />
            <div className="flex-1 h-16 bg-gray-100 rounded-[8px]" />
          </div>
          <div className="h-10 bg-gray-100 rounded-[8px]" />
        </div>
      </div>
    );
  }

  // 错误态（含重试）
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-brand-teal/10 shadow-sm overflow-hidden">
        <div className="px-4 pt-3 pb-3.5">
          <div className="text-[13px] font-bold text-text-primary mb-2">今日运势</div>
          <div className="text-[11px] text-text-tertiary text-center py-3">{error}</div>
          <button onClick={() => fetchFortune()}
            className="w-full py-2 bg-gray-50 rounded-[8px] text-[10px] text-brand-teal-dark font-medium active:scale-[0.98] transition-transform"
            aria-label="重新加载运势">
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null; // TS类型收窄

  // 五行穿衣：取前3个等级的颜色
  const topWuxing = data.wuxingLevels.slice(0, 3);
  const wuxingText = topWuxing.map(l => l.name).join(" / ");
  const bestWuxing = topWuxing[0];

  return (
    <div className="bg-white rounded-xl border border-brand-teal/10 shadow-sm overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-teal via-brand-gold to-brand-coral" />
      <div className="px-4 pt-3 pb-3.5">
        {/* 标题 */}
        <Link href="/daily-fortune"
          className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-bold text-text-primary">今日运势</h2>
            <span className="text-[10px] bg-brand-teal text-white px-2 py-[1px] rounded-full font-medium">
              <span className="sr-only">运势评分：</span>{data.score}分
            </span>
            <span className="text-[11px] font-semibold text-brand-teal-dark">
              <span className="sr-only">评级：</span>{data.tag}
            </span>
          </div>
          <span className="text-[10px] text-text-tertiary">完整运势 →</span>
        </Link>

        {/* 五行穿衣 + 整体运势 — 并排两列 */}
        <div className="flex gap-2 mb-2">
          <div className="flex-1 bg-brand-gold-light/30 rounded-[8px] px-3 py-2 text-center">
            <div className="text-[11px] font-medium text-brand-gold-dark mb-1">五行穿衣</div>
            <div className="flex items-center justify-center gap-1">
              {topWuxing.map((l, i) => (
                <span key={i} className="w-3 h-3 rounded-full inline-block border border-gray-200"
                  style={{ backgroundColor: l.hex }} />
              ))}
            </div>
            <div className="text-[9px] text-text-tertiary mt-1">
              {data.luckyColor ? `${data.luckyColor} / ${wuxingText}` : wuxingText}
            </div>
          </div>
          <div className="flex-1 bg-brand-teal-light/30 rounded-[8px] px-3 py-2 text-center">
            <div className="text-[11px] font-medium text-brand-teal-dark mb-1">整体运势</div>
            <div className="text-[9px] text-text-tertiary">
              宜 {data.do.join(" · ")} 忌 {data.dont.join(" · ")}
            </div>
            <div className="text-[9px] text-brand-teal-dark mt-0.5">幸运方向: {data.direction}</div>
          </div>
        </div>

        {/* 遇事起一卦 — 内嵌长条，对齐上面总宽 */}
        <Link href="/divination"
          className="flex items-center justify-between bg-brand-gold-light/30 rounded-[8px] px-3 py-2.5 active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#D99A0F" strokeWidth="1.5" fill="none" />
              <path d="M12 4v16M4 12h16" stroke="#D99A0F" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-medium text-brand-gold-dark">遇事起一卦</span>
          </div>
          <span className="text-[10px] text-brand-gold-dark font-medium">起卦</span>
        </Link>
      </div>
    </div>
  );
}
