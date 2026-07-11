"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import Link from "next/link";

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
  const [fortune, setFortune] = useState<{
    score: number; tag: string; do: string; dont: string;
    direction: string; wuxing: string; qimen: string;
  } | null>(null);

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
          const data = d.data;
          setFortune({
            score: data.score,
            tag: getTag(data.score).label,
            do: data.advice?.do?.[0] || "好好生活",
            dont: data.advice?.dont?.[0] || "冲动决策",
            direction: data.lucky?.direction || "正南",
            wuxing: data.lucky?.wuxing || "绿色 / 白色 / 红色",
            qimen: data.lucky?.qimen || "开门 · 东北方 · 辛巳时 · 天辅星",
          });
        }
      })
      .catch(() => {});
  }, [user]);

  if (!fortune) return null;

  return (
    <Link href="/daily-fortune"
      className="block bg-white rounded-[12px] border border-[rgba(69,204,213,0.08)] shadow-sm active:scale-[0.98] transition-transform overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-teal via-brand-gold to-brand-coral" />
      <div className="px-4 pt-3 pb-3.5">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-text-primary">今日运势</span>
            <span className="text-[10px] bg-brand-teal text-white px-2 py-[1px] rounded-full font-medium">{fortune.score}分</span>
            <span className="text-[11px] font-semibold text-brand-teal-dark">{fortune.tag}</span>
          </div>
          <span className="text-[10px] text-text-tertiary">完整运势 →</span>
        </div>

        {/* 五行穿衣 */}
        <div className="flex items-center justify-between bg-brand-gold-light/30 rounded-[8px] px-3 py-2 mb-2">
          <span className="text-[11px] font-medium text-brand-gold-dark">五行穿衣</span>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <span className="w-3 h-3 rounded-full bg-brand-teal inline-block" />
              <span className="w-3 h-3 rounded-full bg-white border border-gray-200 inline-block" />
              <span className="w-3 h-3 rounded-full bg-brand-coral inline-block" />
            </div>
            <span className="text-[10px] text-text-tertiary">{fortune.wuxing}</span>
          </div>
        </div>

        {/* 整体运势 */}
        <div className="flex items-center justify-between bg-brand-teal-light/30 rounded-[8px] px-3 py-2 mb-2">
          <span className="text-[11px] font-medium text-brand-teal-dark">整体运势</span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-text-tertiary">宜 {fortune.do} · 忌 {fortune.dont}</span>
            <span className="text-[10px] text-brand-teal-dark">幸运方向: {fortune.direction}</span>
          </div>
        </div>

        {/* 奇门遁甲 */}
        <div className="flex items-center justify-between bg-[rgba(124,58,237,0.06)] rounded-[8px] px-3 py-2">
          <span className="text-[11px] font-medium text-purple-700">奇门遁甲</span>
          <span className="text-[10px] text-text-tertiary">{fortune.qimen}</span>
        </div>
      </div>
    </Link>
  );
}
