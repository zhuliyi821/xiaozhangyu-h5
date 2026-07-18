"use client";

/** 🔮 水晶球精英资产卡片：持有数量、实时分红、档位进度 */
import { useState, useEffect } from "react";

interface Props {
  uid: number;
}

interface CrystalData {
  balance: number;
  daily_dividend: number;
  weekly_dividend: number;
  next_tier_need: number;
  tier_progress: number; // 0-100
}

export default function CrystalCard({ uid }: Props) {
  const [data, setData] = useState<CrystalData | null>(null);

  useEffect(() => {
    fetch(`/api/crystal/dashboard?uid=${uid}`)
      .then(r => r.json())
      .then(d => { if (d.code === 0) setData(d.data); })
      .catch(() => console.warn("请求 失败"));
  }, [uid]);

  if (!data) {
    return (
      <div className="mx-4 -mt-5">
        <div className="bg-gradient-to-br from-[#7F77DD] to-[#534AB7] rounded-[14px] p-4 text-white shadow-lg animate-pulse" style={{ boxShadow: "0 4px 16px rgba(83,74,183,0.25)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-white/10 rounded" />
              <div className="h-3 w-28 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 -mt-5">
      <div
        onClick={() => window.location.href = "/assets?tab=credit3"}
        className="bg-gradient-to-br from-[#7F77DD] to-[#534AB7] rounded-[14px] p-4 text-white shadow-lg active:scale-[0.98] transition-transform cursor-pointer"
        style={{ boxShadow: "0 4px 16px rgba(83,74,183,0.25)" }}
      >
        {/* 上部分：标签 + 实时分红 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[22px]">🔮</span>
            <div>
              <div className="text-[13px] font-medium">水晶球</div>
              <div className="text-[11px] opacity-80">持有 {data.balance} 个</div>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/15 rounded-full px-3 py-1.5">
            <span className="text-[11px] font-medium text-[#97C459]">+{data.daily_dividend} ⛏️</span>
            <span className="text-[9px] opacity-70">今日分红</span>
          </div>
        </div>

        {/* 下部分：7日累计 + 档位进度 */}
        <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-white/15">
          <span className="text-[10px] opacity-80 flex items-center gap-1">
            📈 7日累计 <strong className="text-white">{data.weekly_dividend} ⛏️</strong>
          </span>
          <div className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden max-w-[120px]">
            <div
              className="h-full bg-[#AFA9EC] rounded-full transition-all duration-500"
              style={{ width: `${data.tier_progress}%` }}
            />
          </div>
          <span className="text-[9px] opacity-70">距下一档还差 {data.next_tier_need} 个</span>
        </div>
      </div>
    </div>
  );
}
