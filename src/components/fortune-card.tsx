"use client";
import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { API_BASE } from "@/config/api";

const WUXING_ROW = [
  { key: "金", icon: "⚜️" },
  { key: "木", icon: "🌿" },
  { key: "水", icon: "💧" },
  { key: "火", icon: "🔥" },
  { key: "土", icon: "⛰️" },
];

export default function FortuneCard() {
  const [data, setData] = useState<{
    score: number; tag: string;
    dayElement: string; useGod: string;
    levels: { level: string; name: string; relation: string; shades: string[] }[];
    advice: string;
  } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/fortune/today`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: 1 }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data?.wuxing_dress) {
          const wd = d.data.wuxing_dress;
          const tag = d.data.score >= 85 ? "大吉" : d.data.score >= 70 ? "中吉" : d.data.score >= 55 ? "中平" : "小凶";
          setData({
            score: d.data.score, tag,
            dayElement: wd.day_element,
            useGod: wd.use_god,
            levels: wd.levels,
            advice: wd.advice,
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  const { score, tag, dayElement, useGod, levels, advice } = data;
  const dayIdx = WUXING_ROW.findIndex(w => w.key === dayElement);

  return (
    <Link href="/daily-fortune" className="block mx-3 mt-3">
      <div className="bg-white rounded-[8px] p-4 border border-gray-100 shadow-sm">
        {/* 顶部：标题 + 评分 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-base">👗</span>
            <span className="text-xs font-bold text-brand-teal-dark">今日五行穿衣</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-brand-teal-dark">{score}</span>
            <span className="text-[10px] bg-brand-teal-light/30 text-brand-teal-dark px-2 py-0.5 font-medium">{tag}</span>
          </div>
        </div>

        {/* 信息条 */}
        <div className="flex gap-2 mb-3">
          <span className="text-[10px] bg-brand-teal-light/30 text-brand-teal-dark rounded-[6px] px-2.5 py-0.5 font-medium">
            今日五行：{dayElement}旺
          </span>
          <span className="text-[10px] bg-brand-teal-light/30 text-brand-teal-dark rounded-[6px] px-2.5 py-0.5 font-medium">
            用神：{useGod}
          </span>
        </div>

        {/* 主题居中 — 五行行（紧凑版） */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {WUXING_ROW.map((wx, i) => {
            const isActive = i === dayIdx;
            return (
              <div key={wx.key} className="flex flex-col items-center gap-0.5">
                <div className={`flex items-center gap-0.5 px-1.5 py-1 text-[10px] transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white font-bold"
                    : "text-gray-400"
                }`}>
                  <span>{wx.icon}</span>
                  <span>{wx.key}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 颜色条行 */}
        <div className="flex gap-1.5 mb-3">
          {levels.map((lv) => {
            const barGrad = lv.shades.length > 1
              ? `linear-gradient(90deg, ${lv.shades.map((s, si) => `${s} ${si * (100 / lv.shades.length)}%, ${s} ${(si + 1) * (100 / lv.shades.length)}%`).join(", ")})`
              : lv.shades[0];
            return (
              <div key={lv.level} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-[8px]" style={{ background: barGrad }} />
                <span className="text-[7px] font-medium" style={{
                  color: lv.level === "大吉" ? "#4CAF50" :
                         lv.level === "次吉" ? "#F44336" :
                         lv.level === "平" ? "#FF8F00" : "#9E9E9E"
                }}>
                  {lv.level}
                </span>
              </div>
            );
          })}
        </div>

        {/* AI 穿搭建议（精简） */}
        <div className="bg-brand-teal-light/20 rounded-[10px] p-2.5 mb-2">
          <div className="text-[10px] text-text-secondary leading-relaxed">💡 {advice}</div>
        </div>

        {/* 底部入口 */}
        <div className="flex items-center justify-end gap-1 text-[10px] text-brand-teal font-medium">
          <span>查看完整运势</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}
