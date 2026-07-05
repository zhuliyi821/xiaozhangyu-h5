"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import { Clock, TrendingUp, X } from "lucide-react";

interface HourlyItem { hour: string; time_range: string; zhi_shi_door: string; score: number; label: string; bonus: number; advice: string; }

function scoreColor(s: number): string {
  if (s >= 85) return "from-emerald-400 to-emerald-500";
  if (s >= 70) return "from-brand-teal to-brand-teal-dark";
  if (s >= 55) return "from-amber-400 to-amber-500";
  return "from-red-400 to-red-500";
}

export default function FortuneFloating() {
  const { user } = useAuth();
  const [currentHour, setCurrentHour] = useState<HourlyItem | null>(null);
  const [allHours, setAllHours] = useState<HourlyItem[]>([]);
  const [score, setScore] = useState(85);
  const [trend, setTrend] = useState("up");
  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(false);

  const uid = (user as any)?.uid || 0;

  useEffect(() => {
    if (!uid) { setVisible(false); return; }
    setVisible(true);

    async function fetchFortune() {
      try {
        const r = await fetch(`${API_BASE}/api/v1/fortune/today`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: uid }),
        });
        const j = await r.json();
        if (j.code === 0) {
          setScore(j.data.score);
          setTrend(j.data.trend);
        }
      } catch {}

      try {
        const r = await fetch(`${API_BASE}/api/v1/fortune/detail`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: uid }),
        });
        const j = await r.json();
        if (j.code === 0 && j.data.hourly) {
          setAllHours(j.data.hourly);
          const h = new Date().getHours();
          const idx = Math.floor(h / 2) % 12;
          setCurrentHour(j.data.hourly[idx] || j.data.hourly[0]);
        }
      } catch {}
    }

    fetchFortune();
    // Auto-refresh every 10 minutes
    const timer = setInterval(fetchFortune, 600000);
    return () => clearInterval(timer);
  }, [uid]);

  // Update current hour every 2 minutes (check for hour change)
  useEffect(() => {
    const checkHour = () => {
      if (allHours.length === 0) return;
      const h = new Date().getHours();
      const idx = Math.floor(h / 2) % 12;
      setCurrentHour(allHours[idx]);
    };
    const timer = setInterval(checkHour, 120000);
    return () => clearInterval(timer);
  }, [allHours]);

  if (!visible || !currentHour) return null;

  const isGreat = score >= 85;

  return (
    <>
      {/* ── 悬浮球 ── */}
      <button
        onClick={() => setShowModal(true)}
        className={`fixed right-3 z-40 bottom-28 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg flex flex-col items-center justify-center active:scale-90 transition-all duration-300 hover:shadow-xl ${
          isGreat ? "animate-pulse shadow-purple-400/50" : ""
        }`}
        style={{
          boxShadow: isGreat ? "0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.2)" : undefined,
        }}
      >
        <div className="text-white text-[10px] font-bold leading-none">{currentHour.score}</div>
        <div className="text-white/80 text-[6px] mt-0.5 leading-none">{currentHour.zhi_shi_door}</div>
        {isGreat && <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping" />}
      </button>

      {/* ── 半屏弹窗 ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-[24px] shadow-xl max-h-[70vh] overflow-y-auto pb-8">
            {/* 标题栏 */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md rounded-t-[24px] border-b border-purple-100">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-bold text-purple-800">实时奇门运势</span>
                </div>
                <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center active:scale-90">
                  <X className="w-3.5 h-3.5 text-purple-500" />
                </button>
              </div>
            </div>

            <div className="px-5 pt-4">
              {/* 当前时辰大卡 */}
              <div className={`rounded-[20px] p-5 text-white shadow-sm mb-5 bg-gradient-to-br ${scoreColor(score)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs opacity-80">{currentHour.hour} ({currentHour.time_range})</div>
                  <div className="bg-white/20 rounded-full px-3 py-0.5 text-[10px] font-medium">
                    {currentHour.zhi_shi_door}
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div className="text-4xl font-bold">{currentHour.score}<span className="text-base font-normal text-white/70 ml-1">分</span></div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{currentHour.label}</span>
                    {currentHour.bonus > 0 && (
                      <span className="bg-yellow-300 text-yellow-800 text-[9px] font-bold rounded-full px-2 py-0.5 ml-1">
                        +{currentHour.bonus}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-white/80">{currentHour.advice}</div>
              </div>

              {/* 12时辰走势 */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-purple-800">今日时辰走势</span>
                </div>
                <div className="overflow-x-auto scrollbar-none -mx-1">
                  <div className="flex gap-2 min-w-max px-1">
                    {allHours.map((h, i) => {
                      const hNow = new Date().getHours();
                      const isNow = i === Math.floor(hNow / 2) % 12;
                      return (
                        <div key={i} className={`flex flex-col items-center gap-1 p-2 rounded-[12px] min-w-[48px] transition-all ${isNow ? "bg-purple-100 ring-2 ring-purple-400 ring-offset-1" : "bg-purple-50/50"}`}>
                          <div className="text-[8px] text-purple-500 font-medium">{h.hour}</div>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                            h.score >= 85 ? "bg-gradient-to-br from-emerald-400 to-emerald-500" :
                            h.score >= 70 ? "bg-gradient-to-br from-brand-teal to-brand-teal-dark" :
                            h.score >= 55 ? "bg-gradient-to-br from-amber-400 to-amber-500" :
                            "bg-gradient-to-br from-red-400 to-red-500"
                          }`}>{h.score}</div>
                          {h.bonus > 0 && <div className="text-[6px] text-amber-500 font-bold">+{h.bonus}%</div>}
                          {isNow && <div className="text-[6px] text-purple-600 font-bold">←</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 行动CTA */}
              <div className="flex gap-3">
                <a href="/ai?tab=lottery" className="flex-1 text-center bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[14px] py-3 text-xs font-semibold active:scale-95 transition-transform">
                  🎯 去预测
                </a>
                <a href="/daily-fortune" className="flex-1 text-center bg-purple-50 text-purple-700 rounded-[14px] py-3 text-xs font-semibold border border-purple-200 active:scale-95 transition-transform">
                  📊 看详情
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
