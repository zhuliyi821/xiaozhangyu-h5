"use client";

import { useState, useEffect } from "react";
import { getLatestDraws, getHistory, DrawResult, HistoryItem } from "@/lib/api";

const LOTTERY_CONFIG: Record<string, { name: string; frontColor: string; backColor: string; frontLabel: string; backLabel: string }> = {
  dlt: { name: "大乐透", frontColor: "from-brand-coral to-brand-coral-dark", backColor: "from-brand-teal to-brand-teal-dark", frontLabel: "前区", backLabel: "后区" },
  ssq: { name: "双色球", frontColor: "from-brand-coral to-brand-coral-dark", backColor: "from-blue-400 to-blue-600", frontLabel: "红球", backLabel: "蓝球" },
  pl3: { name: "排列3", frontColor: "from-purple-400 to-purple-600", backColor: "", frontLabel: "号码", backLabel: "" },
  fc3d: { name: "3D", frontColor: "from-green-400 to-green-600", backColor: "", frontLabel: "号码", backLabel: "" },
  kl8: { name: "快乐8", frontColor: "from-amber-400 to-orange-500", backColor: "", frontLabel: "号码", backLabel: "" },
  qxc: { name: "七星彩", frontColor: "from-pink-400 to-pink-600", backColor: "", frontLabel: "号码", backLabel: "" },
};

export default function DrawQueryPage() {
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [activeKey, setActiveKey] = useState("dlt");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const activeDraw = draws.find(d => d.key === activeKey);
  const cfg = LOTTERY_CONFIG[activeKey] || LOTTERY_CONFIG.dlt;

  useEffect(() => {
    getLatestDraws().then(setDraws).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeKey) {
      getHistory(activeKey, 1, 20).then(r => setHistory(r.list || [])).catch(() => {});
    }
  }, [activeKey]);

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-[rgba(69,204,213,0.08)]">
        <div className="flex items-center px-4 h-12 gap-2">
          <button onClick={() => window.history.back()} className="text-text-secondary text-lg">‹</button>
          <h1 className="text-base font-semibold flex-1">开奖查询</h1>
        </div>
        {/* Type tabs */}
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto scrollbar-none">
          {Object.entries(LOTTERY_CONFIG).map(([key, conf]) => (
            <button key={key} onClick={() => { setActiveKey(key); setPage(1); }}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-[4px] text-xs font-medium transition-colors ${
                activeKey === key
                  ? "bg-brand-teal text-white shadow-sm"
                  : "bg-surface text-text-secondary border border-[rgba(69,204,213,0.08)]"
              }`}>
              {conf.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-surface rounded-[4px] animate-pulse" />)}
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-4">
          {/* Latest Draw Detail */}
          {activeDraw && (
            <div className="bg-surface rounded-[4px] p-5 shadow-sm border border-[rgba(69,204,213,0.08)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{cfg.name}</span>
                  <span className="bg-gradient-to-r from-brand-gold to-brand-coral text-white text-[10px] px-2 py-0.5 rounded-[10px] font-semibold">
                    第{activeDraw.period}期
                  </span>
                </div>
                <span className="text-xs text-text-tertiary">{activeDraw.date}</span>
              </div>

              {/* Number Balls */}
              <div className="flex items-center justify-center gap-1.5 py-4 mb-3">
                {activeDraw.front.map((n, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-[42px] h-[42px] rounded-full bg-gradient-to-br ${cfg.frontColor} text-white flex items-center justify-center text-sm font-bold shadow-lg animate-bounce`}
                      style={{ animationDelay: `${i * 0.1}s`, animationDuration: "0.6s" }}>
                      {n}
                    </div>
                  </div>
                ))}
                {activeDraw.back.length > 0 && (
                  <>
                    <span className="text-text-tertiary text-lg mx-1">+</span>
                    {activeDraw.back.map((n, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className={`w-[42px] h-[42px] rounded-full bg-gradient-to-br ${cfg.backColor} text-white flex items-center justify-center text-sm font-bold shadow-lg animate-bounce`}
                          style={{ animationDelay: `${(activeDraw.front.length + i) * 0.1}s`, animationDuration: "0.6s" }}>
                          {n}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-bg rounded-[4px] p-3 text-center">
                  <div className="text-[10px] text-text-tertiary">一等奖</div>
                  <div className="text-sm font-bold text-brand-coral mt-0.5">{activeDraw.prize1 || "-"}</div>
                </div>
                <div className="bg-bg rounded-[4px] p-3 text-center">
                  <div className="text-[10px] text-text-tertiary">奖池</div>
                  <div className="text-xs font-bold mt-0.5 truncate">{activeDraw.pool ? `${(Number(activeDraw.pool.replace(/,/g, '')) / 1e8).toFixed(1)}亿` : "-"}</div>
                </div>
                <div className="bg-bg rounded-[4px] p-3 text-center">
                  <div className="text-[10px] text-text-tertiary">销售额</div>
                  <div className="text-xs font-bold mt-0.5 truncate">{activeDraw.sales ? `${(Number(activeDraw.sales.replace(/,/g, '')) / 1e4).toFixed(0)}万` : "-"}</div>
                </div>
              </div>
            </div>
          )}

          {/* History List */}
          <div className="bg-surface rounded-[4px] p-4 shadow-sm border border-[rgba(69,204,213,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold">历史开奖</span>
              <span className="text-[10px] text-text-tertiary">共 {history.length} 期</span>
            </div>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={h.period} className={`flex items-center gap-3 py-2 ${i !== history.length - 1 ? "border-b border-[rgba(69,204,213,0.06)]" : ""}`}>
                  <div className="w-14 shrink-0">
                    <div className="text-[11px] font-semibold">第{h.period}期</div>
                    <div className="text-[9px] text-text-tertiary">{h.date}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-1 flex-wrap">
                    {h.front.map((n, j) => (
                      <span key={j} className={`w-[24px] h-[24px] rounded-full bg-gradient-to-br ${cfg.frontColor} text-white flex items-center justify-center text-[9px] font-bold`}>
                        {n}
                      </span>
                    ))}
                    {h.back.length > 0 && (
                      <>
                        <span className="text-text-tertiary text-[10px]">+</span>
                        {h.back.map((n, j) => (
                          <span key={j} className={`w-[24px] h-[24px] rounded-full bg-gradient-to-br ${cfg.backColor} text-white flex items-center justify-center text-[9px] font-bold`}>
                            {n}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
