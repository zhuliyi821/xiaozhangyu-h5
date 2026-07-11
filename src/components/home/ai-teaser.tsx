"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Prediction {
  category: string;
  title: string;
  confidence: number;
  direction: string;
}

export function AiTeaser() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    fetch("/api/ai-report")
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data?.predictions) {
          setPredictions(d.data.predictions.slice(0, 2));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Link href="/ai-predictions"
      className="block bg-white rounded-[12px] border border-[rgba(69,204,213,0.08)] shadow-sm p-4 active:scale-[0.98] transition-transform">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-text-primary">AI 预测日报</span>
          <span className="text-[9px] bg-purple-600 text-white px-2 py-[1px] rounded-full font-medium">每日</span>
        </div>
        <span className="text-[11px] font-medium text-brand-teal">去AI预测 →</span>
      </div>
      {predictions.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {predictions.map((p, i) => (
            <div key={i} className="bg-[rgba(124,58,237,0.06)] rounded-[8px] px-3 py-2">
              <span className="text-[12px] font-semibold text-purple-700">
                {p.title?.length > 12 ? p.title.slice(0, 12) + "..." : p.title || "加载中"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[rgba(124,58,237,0.06)] rounded-[8px] px-3 py-2">
            <span className="text-[12px] font-semibold text-purple-700">BTC 看涨 72%</span>
          </div>
          <div className="bg-[rgba(124,58,237,0.06)] rounded-[8px] px-3 py-2">
            <span className="text-[12px] font-semibold text-purple-700">股指 +2.03%</span>
          </div>
        </div>
      )}
    </Link>
  );
}
