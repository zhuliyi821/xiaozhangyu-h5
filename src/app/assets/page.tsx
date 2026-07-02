"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getProfile } from "@/lib/api";

const assetList = [
  { key: "sim_coin", icon: "🫘", name: "游戏豆", desc: "用于投注预测、激活冻结豆", color: "from-indigo-400 to-purple-500" },
  { key: "credit1", icon: "🎮", name: "积分", desc: "平台通用积分", color: "from-brand-teal to-brand-teal-dark" },
  { key: "credit4", icon: "🫘", name: "闲豆", desc: "闲豆商城支付", color: "from-amber-400 to-orange-500" },
  { key: "credit3", icon: "🔮", name: "水晶球", desc: "可用闲豆（已激活）", color: "from-violet-400 to-pink-500" },
  { key: "frozen_credit3", icon: "🧊", name: "冻结豆", desc: "投注赢的奖励，需激活为闲豆", color: "from-cyan-400 to-blue-500" },
  { key: "credit2", icon: "¥", name: "余额", desc: "现金余额", color: "from-green-400 to-emerald-500" },
  { key: "granted_sim_coin", icon: "🎁", name: "授予游戏豆", desc: "累计获得的赠送游戏豆", color: "from-rose-400 to-red-500" },
];

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getProfile(user.uid)
      .then(p => setAssets(p.assets as unknown as Record<string, number>))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <main className="min-h-screen bg-bg pb-24">
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-[rgba(69,204,213,0.08)]">
        <div className="flex items-center px-4 h-12">
          <button onClick={() => window.history.back()} className="text-text-secondary text-lg mr-3">‹</button>
          <h1 className="text-base font-semibold">我的资产</h1>
        </div>
      </div>

      {/* 总资产卡片 */}
      {!loading && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-brand-teal to-brand-teal-dark rounded-[20px] p-5 text-white">
          <div className="text-[11px] opacity-80">总资产概览</div>
          <div className="text-2xl font-bold mt-1">
            ¥{(assets.credit2 || 0).toFixed(2)}
          </div>
          <div className="text-[11px] opacity-70 mt-1">现金余额</div>
        </div>
      )}

      {loading ? (
        <div className="px-4 mt-4 space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-surface rounded-[16px] animate-pulse" />)}
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-3">
          {assetList.map(a => {
            const val = assets[a.key] ?? 0;
            return (
              <div key={a.key} className="bg-surface rounded-[20px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)] flex items-center gap-3">
                <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-r ${a.color} flex items-center justify-center text-lg text-white shadow-sm shrink-0`}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{a.name}</div>
                  <div className="text-[10px] text-text-tertiary">{a.desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{a.key === "credit2" ? `¥${val.toFixed(2)}` : String(Math.floor(val))}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
