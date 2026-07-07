"use client";

// In imports section, add Link
import Link from "next/link";
import { useState, useEffect } from "react";
import { getLatestDraws, DrawResult } from "@/lib/api";

export function DrawCard() {
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestDraws()
      .then(setDraws)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dlt = draws.find((d) => d.key === "dlt");

  if (loading) {
    return (
      <section className="mt-5 px-4">
        <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 animate-pulse">
          <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
          <div className="flex gap-1 mb-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-[34px] h-[34px] rounded-full bg-gray-200" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-[12px]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-5 px-4">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-base font-bold flex items-center gap-2 before:content-[''] before:w-1 before:h-[17px] before:rounded-sm before:bg-gradient-to-b from-brand-teal to-brand-coral">
          最新开奖
        </h2>
        <span className="text-xs text-brand-teal font-medium">全部</span>
      </div>

      {draws.slice(0, 3).map((draw) => (
        <Link key={draw.key} href={`/lottery/${draw.key}/chart`} className="bg-white rounded-[20px] p-4 mb-2.5 shadow-sm border border-gray-100 block active:scale-[0.98] transition-transform">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5 font-semibold text-sm">
              <span>{draw.name}</span>
              <span className="bg-gradient-to-r from-brand-coral to-brand-coral-dark text-white text-[10px] px-2 py-0.5 rounded-[10px]">
                {draw.period} 期
              </span>
            </div>
            <span className="text-[10px] text-text-tertiary">{draw.date}</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {draw.front.map((n, i) => (
              <span key={i} className="w-[28px] h-[28px] rounded-full bg-gradient-to-br from-brand-coral to-brand-coral-dark text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                {n}
              </span>
            ))}
            {draw.back.length > 0 && (
              <>
                <span className="text-text-tertiary text-xs mx-0.5">+</span>
                {draw.back.map((n, i) => (
                  <span key={i} className="w-[28px] h-[28px] rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                    {n}
                  </span>
                ))}
              </>
            )}
          </div>
        </Link>
      ))}
    </section>
  );
}
