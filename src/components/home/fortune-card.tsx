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

  useEffect(() => {
    const uid = (user as any)?.uid || 0;
    fetch(`${API_BASE}/api/v1/fortune/today`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: uid }),
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
        }
      })
      .catch(() => {});
  }, [user]);

  if (!data) return null;

  // 五行穿衣：取前3个等级的颜色
  const topWuxing = data.wuxingLevels.slice(0, 3);
  const wuxingText = topWuxing.map(l => l.name).join(" / ");
  const bestWuxing = topWuxing[0];

  return (
    <Link href="/daily-fortune"
      className="block bg-white rounded-[12px] border border-[rgba(69,204,213,0.08)] shadow-sm active:scale-[0.98] transition-transform overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-teal via-brand-gold to-brand-coral" />
      <div className="px-4 pt-3 pb-3.5">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-text-primary">今日运势</span>
            <span className="text-[10px] bg-brand-teal text-white px-2 py-[1px] rounded-full font-medium">{data.score}分</span>
            <span className="text-[11px] font-semibold text-brand-teal-dark">{data.tag}</span>
          </div>
          <span className="text-[10px] text-text-tertiary">完整运势 →</span>
        </div>

        {/* 五行穿衣 — 真实API数据 */}
        <div className="flex items-center justify-between bg-brand-gold-light/30 rounded-[8px] px-3 py-2 mb-2">
          <span className="text-[11px] font-medium text-brand-gold-dark">五行穿衣</span>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {topWuxing.map((l, i) => (
                <span key={i} className="w-3 h-3 rounded-full inline-block border border-gray-200"
                  style={{ backgroundColor: l.hex }} />
              ))}
            </div>
            <span className="text-[10px] text-text-tertiary">
              {data.luckyColor ? `${data.luckyColor} · ${wuxingText}` : wuxingText}
            </span>
          </div>
        </div>

        {/* 整体运势 — 真实宜忌+方向 */}
        <div className="flex items-center justify-between bg-brand-teal-light/30 rounded-[8px] px-3 py-2 mb-2">
          <span className="text-[11px] font-medium text-brand-teal-dark">整体运势</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-text-tertiary">
              宜 {data.do.join(" · ")} 忌 {data.dont.join(" · ")}
            </span>
            <span className="text-[10px] text-brand-teal-dark">幸运方向: {data.direction}</span>
          </div>
        </div>

        {/* 五行穿衣建议 — 替代奇门遁甲(API无此数据) */}
        {data.wuxingAdvice && (
          <div className="flex items-center justify-between bg-[rgba(124,58,237,0.06)] rounded-[8px] px-3 py-2">
            <span className="text-[11px] font-medium text-purple-700">穿搭建议</span>
            <span className="text-[10px] text-text-tertiary text-right max-w-[220px] truncate">{data.wuxingAdvice}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
